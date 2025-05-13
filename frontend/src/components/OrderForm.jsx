import { useState, useEffect } from 'react';
import api from '../services/api';

function OrderForm({ orderId, onSave }) {
  const [formData, setFormData] = useState({
    user_id: '',
    total_price: 0,
    status: 'pending',
    address_id: '',
    tracking_number: '',
  });
  const [users, setUsers] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, addressRes] = await Promise.all([
          api.get('/users'),
          api.get('/addresses'),
        ]);
        setUsers(Array.isArray(userRes.data) ? userRes.data : []);
        setAddresses(addressRes.data);
        if (orderId) {
          const orderRes = await api.get(`/orders/${orderId}`);
          setFormData(orderRes.data);
        }
      } catch (error) {
        alert('Ошибка загрузки данных');
      }
    };
    fetchData();
  }, [orderId]);

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
      onSave();
      setFormData({ user_id: '', total_price: 0, status: 'pending', address_id: '', tracking_number: '' });
      setErrors({});
    } catch (error) {
      alert('Ошибка сохранения заказа: ' + (error.response?.data?.message || 'Ошибка сервера'));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Пользователь:</label>
        <select
          value={formData.user_id}
          onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
        >
          <option value="">Выберите пользователя</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.email}
            </option>
          ))}
        </select>
        {errors.user_id && <p style={{ color: 'red' }}>{errors.user_id}</p>}
      </div>
      <div>
        <label>Общая сумма:</label>
        <input
          type="number"
          value={formData.total_price}
          onChange={(e) => setFormData({ ...formData, total_price: e.target.value })}
          placeholder="Общая сумма"
        />
        {errors.total_price && <p style={{ color: 'red' }}>{errors.total_price}</p>}
      </div>
      <div>
        <label>Статус:</label>
        <select
          value={formData.status}
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
          value={formData.address_id}
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
          value={formData.tracking_number}
          onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
          placeholder="Трек-номер"
        />
        {errors.tracking_number && <p style={{ color: 'red' }}>{errors.tracking_number}</p>}
      </div>
      <button type="submit">Сохранить</button>
    </form>
  );
}

export default OrderForm;