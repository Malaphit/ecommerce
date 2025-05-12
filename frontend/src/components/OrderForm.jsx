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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, addressRes] = await Promise.all([
          api.get('/users'),
          api.get('/addresses'),
        ]);
        setUsers(userRes.data);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (orderId) {
        await api.put(`/orders/${orderId}`, formData);
      } else {
        await api.post('/orders', formData);
      }
      onSave();
    } catch (error) {
      alert('Ошибка сохранения заказа');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <select
        value={formData.user_id}
        onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
        required
      >
        <option value="">Выберите пользователя</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.email}
          </option>
        ))}
      </select>
      <input
        type="number"
        value={formData.total_price}
        onChange={(e) => setFormData({ ...formData, total_price: e.target.value })}
        placeholder="Общая сумма"
        required
      />
      <select
        value={formData.status}
        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
      >
        <option value="pending">В обработке</option>
        <option value="shipped">Отправлен</option>
        <option value="delivered">Доставлен</option>
        <option value="cancelled">Отменен</option>
      </select>
      <select
        value={formData.address_id}
        onChange={(e) => setFormData({ ...formData, address_id: e.target.value })}
        required
      >
        <option value="">Выберите адрес</option>
        {addresses.map((addr) => (
          <option key={addr.id} value={addr.id}>
            {addr.city}, {addr.street}, {addr.house}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={formData.tracking_number}
        onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
        placeholder="Трек-номер"
      />
      <button type="submit">Сохранить</button>
    </form>
  );
}

export default OrderForm;