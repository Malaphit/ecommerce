import { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash.debounce';
import api from '../services/api';

function OrderForm({ orderId, onSave }) {
  const [formData, setFormData] = useState({
    user_id: '',
    total_price: 0,
    status: 'pending',
    address_id: '',
    tracking_number: '',
  });
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState(null);
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
            total_price: order.total_price || 0,
            status: order.status || 'pending',
            address_id: order.address_id || '',
            tracking_number: order.tracking_number || '',
          });
          if (order.user_id) {
            const userRes = await api.get(`/users/${order.user_id}`);
            setSearchEmail(userRes.data.email || '');
            setSearchResult({ id: order.user_id, email: userRes.data.email });
          }
        }
      } catch (error) {
        setErrors({ general: error.response?.data?.message || 'Ошибка загрузки данных' });
      }
    };
    fetchData();
  }, [orderId]);

  const searchUser = useCallback(
    debounce(async (email) => {
      if (!email) {
        setSearchResult(null);
        setSearchError('');
        setFormData((prev) => ({ ...prev, user_id: '' }));
        return;
      }
      try {
        const res = await api.get(`/users?email=${encodeURIComponent(email)}`);
        const users = Array.isArray(res.data) ? res.data : [];
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase()) || users[0];
        if (user) {
          setSearchResult({ id: user.id, email: user.email });
          setFormData((prev) => ({ ...prev, user_id: user.id }));
          setSearchError('');
        } else {
          setSearchResult(null);
          setFormData((prev) => ({ ...prev, user_id: '' }));
          setSearchError('Пользователь не найден');
        }
      } catch (error) {
        setSearchResult(null);
        setFormData((prev) => ({ ...prev, user_id: '' }));
        setSearchError(error.response?.data?.message || 'Ошибка поиска пользователя');
      }
    }, 500),
    []
  );

  useEffect(() => {
    searchUser(searchEmail);
  }, [searchEmail, searchUser]);

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
      if (orderId) {
        await api.put(`/orders/${orderId}`, formData);
      } else {
        await api.post('/orders', formData);
      }
      setFormData({ user_id: '', total_price: 0, status: 'pending', address_id: '', tracking_number: '' });
      setSearchEmail('');
      setSearchResult(null);
      setSearchError('');
      setErrors({});
      onSave();
    } catch (error) {
      setErrors({ general: error.response?.data?.message || 'Ошибка сохранения заказа' });
    }
  };

  return (
    <div>
      <h2>{orderId ? 'Редактировать заказ' : 'Добавить заказ'}</h2>
      {errors.general && <p style={{ color: 'red' }}>{errors.general}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Пользователь (email):</label>
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Введите email"
          />
          {searchResult && (
            <p style={{ color: 'green' }}>Найден: {searchResult.email} (ID: {searchResult.id})</p>
          )}
          {searchError && <p style={{ color: 'red' }}>{searchError}</p>}
          {errors.user_id && <p style={{ color: 'red' }}>{errors.user_id}</p>}
        </div>
        <div>
          <label>Общая сумма:</label>
          <input
            type="number"
            step="0.01"
            value={formData.total_price || 0}
            onChange={(e) => setFormData((prev) => ({ ...prev, total_price: e.target.value }))}
            placeholder="Общая сумма"
          />
          {errors.total_price && <p style={{ color: 'red' }}>{errors.total_price}</p>}
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
          {errors.address_id && <p style={{ color: 'red' }}>{errors.address_id}</p>}
        </div>
        <div>
          <label>Трек-номер:</label>
          <input
            type="text"
            value={formData.tracking_number || ''}
            onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
            placeholder="Трек-номер"
          />
          {errors.tracking_number && <p style={{ color: 'red' }}>{errors.tracking_number}</p>}
        </div>
        <button type="submit">Сохранить</button>
      </form>
    </div>
  );
}

export default OrderForm;