import { useState, useEffect } from 'react';
import debounce from 'lodash.debounce';
import api from '../services/api';
import { toast } from 'react-toastify';

function OrderForm({ orderId, onSave }) {
  const [formData, setFormData] = useState({
    user_id: '',
    user_email: '',
    total_price: 0,
    status: 'pending',
    address_id: '',
    tracking_number: '',
  });
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const addressRes = await api.get('/addresses');
        setAddresses(Array.isArray(addressRes.data) ? addressRes.data : []);

        if (orderId) {
          const orderRes = await api.get(`/orders/${orderId}`);
          const order = orderRes.data;
          setFormData({
            user_id: order.user_id || '',
            user_email: order.user?.email || '',
            total_price: order.total_price || 0,
            status: order.status || 'pending',
            address_id: order.address_id || '',
            tracking_number: order.tracking_number || '',
          });
          setSearchEmail(order.user?.email || '');
        }
      } catch (error) {
        const message = error.response?.data?.message || 'Ошибка загрузки данных заказа';
        setErrors({ general: message });
        toast.error(message);
      }
    };
    fetchData();
  }, [orderId]);

  const searchUser = debounce(async (email) => {
    if (!email) {
      setSearchResults([]);
      setSearchError('');
      setFormData((prev) => ({ ...prev, user_id: '', user_email: '' }));
      return;
    }
    try {
      const res = await api.get(`/users?email=${encodeURIComponent(email)}`);
      const users = Array.isArray(res.data) ? res.data : [];
      setSearchResults(users);
      setSearchError(users.length === 0 ? 'Пользователь не найден' : '');
    } catch (error) {
      setSearchResults([]);
      setSearchError(error.response?.data?.message || 'Ошибка поиска пользователя');
      toast.error(error.response?.data?.message || 'Ошибка поиска пользователя');
    }
  }, 500);

  useEffect(() => {
    searchUser(searchEmail);
    return () => searchUser.cancel();
  }, [searchEmail]);

  const handleSelectUser = (user) => {
    setFormData((prev) => ({
      ...prev,
      user_id: user.id,
      user_email: user.email,
    }));
    setSearchEmail(user.email);
    setSearchResults([]);
    setSearchError('');
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.user_id) newErrors.user_id = 'Пользователь обязателен';
    if (!formData.total_price || formData.total_price <= 0) newErrors.total_price = 'Сумма должна быть больше 0';
    if (!formData.address_id) newErrors.address_id = 'Адрес обязателен';
    if (formData.tracking_number && formData.tracking_number.length > 50) {
      newErrors.tracking_number = 'Трек-номер слишком длинный';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const payload = { ...formData };
      delete payload.user_email;
      if (orderId) {
        await api.put(`/orders/${orderId}`, payload);
        toast.success('Заказ обновлён');
      } else {
        await api.post('/orders', payload);
        toast.success('Заказ создан');
      }
      setFormData({
        user_id: '',
        user_email: '',
        total_price: 0,
        status: 'pending',
        address_id: '',
        tracking_number: '',
      });
      setSearchEmail('');
      setSearchResults([]);
      setSearchError('');
      setErrors({});
      onSave();
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка сохранения заказа';
      setErrors({ general: message });
      toast.error(message);
    }
  };

  return (
    <div className="form-container">
      <h2>{orderId ? 'Редактировать заказ' : 'Добавить заказ'}</h2>
      {errors.general && <p className="error">{errors.general}</p>}
      <form onSubmit={handleSubmit}>
        <div className="autocomplete-container">
          <label>Пользователь (email):</label>
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Введите email"
          />
          {searchResults.length > 0 && (
            <ul className="autocomplete-list">
              {searchResults.map((user) => (
                <li
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`autocomplete-item ${formData.user_id === user.id ? 'selected' : ''}`}
                >
                  {user.email}
                </li>
              ))}
            </ul>
          )}
          {formData.user_email && (
            <p className="success">
              Выбрано: {formData.user_email} (ID: {formData.user_id})
            </p>
          )}
          {searchError && <p className="error">{searchError}</p>}
          {errors.user_id && <p className="error">{errors.user_id}</p>}
        </div>
        <div>
          <label>Общая сумма:</label>
          <input
            type="number"
            step="0.01"
            value={formData.total_price || 0}
            onChange={(e) => setFormData((prev) => ({ ...prev, total_price: parseFloat(e.target.value) || 0 }))}
            placeholder="Общая сумма"
          />
          {errors.total_price && <p className="error">{errors.total_price}</p>}
        </div>
        <div>
          <label>Статус:</label>
          <select
            value={formData.status || 'pending'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="pending">В обработке</option>
            <option value="shipped">Отправлен</option>
            <option value="delivered">Доставлен</option>
            <option value="cancelled">Отменен</option>
          </select>
        </div>
        <div>
          <label>Адрес:</label>
          <select
            value={formData.address_id || ''}
            onChange={(e) => setFormData({ ...formData, address_id: e.target.value })}
          >
            <option value="">Выберите адрес</option>
            {addresses.map((addr) => (
              <option key={addr.id} value={addr.id}>
                {addr.city}, {addr.street}, {addr.house}
              </option>
            ))}
          </select>
          {errors.address_id && <p className="error">{errors.address_id}</p>}
        </div>
        <div>
          <label>Трек-номер:</label>
          <input
            type="text"
            value={formData.tracking_number || ''}
            onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
            placeholder="Трек-номер"
          />
          {errors.tracking_number && <p className="error">{errors.tracking_number}</p>}
        </div>
        <button type="submit">Сохранить</button>
      </form>
    </div>
  );
}

export default OrderForm;