import { useState, useEffect } from 'react';
import api from '../services/api';

function UserForm({ userId, onSave }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'user',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (userId) {
      api
        .get(`/users/${userId}`)
        .then((response) =>
          setFormData({
            email: response.data.email || '',
            password: '',
            first_name: response.data.first_name || '',
            last_name: response.data.last_name || '',
            phone: response.data.phone || '',
            role: response.data.role || 'user',
          })
        )
        .catch(() => setErrors({ general: 'Ошибка загрузки данных пользователя' }));
    }
  }, [userId]);

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email обязателен';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Неверный формат email';
    if (!userId && !formData.password) newErrors.password = 'Пароль обязателен';
    else if (formData.password && formData.password.length < 6) newErrors.password = 'Пароль минимум 6 символов';
    if (formData.first_name && formData.first_name.length > 100) newErrors.first_name = 'Имя слишком длинное';
    if (formData.last_name && formData.last_name.length > 100) newErrors.last_name = 'Фамилия слишком длинная';
    if (formData.phone && !/^[0-9+\-() ]+$/.test(formData.phone)) newErrors.phone = 'Неверный формат телефона';
    if (!['user', 'admin', 'manager'].includes(formData.role)) newErrors.role = 'Недопустимая роль';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      if (userId) {
        await api.put(`/users/${userId}`, payload);
      } else {
        await api.post('/users', payload);
      }
      setFormData({ email: '', password: '', first_name: '', last_name: '', phone: '', role: 'user' });
      setErrors({});
      onSave();
    } catch (error) {
      const message = error.response?.data?.message || 'Ошибка сохранения пользователя';
      setErrors({ general: message });
      if (message.includes('уже существует')) setErrors({ email: 'Email уже существует' });
    }
  };

  return (
    <div>
      <h2>{userId ? 'Редактировать пользователя' : 'Добавить пользователя'}</h2>
      {errors.general && <p style={{ color: 'red' }}>{errors.general}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Email"
          />
          {errors.email && <p style={{ color: 'red' }}>{errors.email}</p>}
        </div>
        <div>
          <label>Пароль:</label>
          <input
            type="password"
            value={formData.password || ''}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder={userId ? 'Новый пароль (если нужен)' : 'Пароль'}
          />
          {errors.password && <p style={{ color: 'red' }}>{errors.password}</p>}
        </div>
        <div>
          <label>Имя:</label>
          <input
            type="text"
            value={formData.first_name || ''}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="Имя"
          />
          {errors.first_name && <p style={{ color: 'red' }}>{errors.first_name}</p>}
        </div>
        <div>
          <label>Фамилия:</label>
          <input
            type="text"
            value={formData.last_name || ''}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            placeholder="Фамилия"
          />
          {errors.last_name && <p style={{ color: 'red' }}>{errors.last_name}</p>}
        </div>
        <div>
          <label>Телефон:</label>
          <input
            type="text"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Телефон"
          />
          {errors.phone && <p style={{ color: 'red' }}>{errors.phone}</p>}
        </div>
        <div>
          <label>Роль:</label>
          <select
            value={formData.role || 'user'}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="user">Пользователь</option>
            <option value="admin">Админ</option>
            <option value="manager">Менеджер</option>
          </select>
          {errors.role && <p style={{ color: 'red' }}>{errors.role}</p>}
        </div>
        <button type="submit">Сохранить</button>
      </form>
    </div>
  );
}

export default UserForm;