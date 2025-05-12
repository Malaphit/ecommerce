import { useState, useEffect } from 'react';
import api from '../services/api';

function UserForm({ userId, onSave }) {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'user',
  });

  useEffect(() => {
    if (userId) {
        api.get(`/users/${userId}`).then((response) => {
            const data = response.data || {};
            setFormData({
              email: data.email || '',
              first_name: data.first_name || '',
              last_name: data.last_name || '',
              phone: data.phone || '',
              role: data.role || 'user',
            });
          });          
    }
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (userId) {
        await api.put(`/users/${userId}`, formData);
      } else {
        await api.post('/users', formData);
      }
      onSave();
    } catch (error) {
      alert('Ошибка сохранения пользователя');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
        required
      />
      <input
        type="text"
        value={formData.first_name}
        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
        placeholder="Имя"
      />
      <input
        type="text"
        value={formData.last_name}
        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
        placeholder="Фамилия"
      />
      <input
        type="text"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        placeholder="Телефон"
      />
      <select
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
      >
        <option value="user">Пользователь</option>
        <option value="admin">Админ</option>
        <option value="manager">Менеджер</option>
      </select>
      <button type="submit">Сохранить</button>
    </form>
  );
}

export default UserForm;