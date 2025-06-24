import { useState, useEffect } from 'react';
import api from '../services/api';

function UserForm({ userId, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'user',
    password: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (userId) {
      api
        .get(`/users/${userId}`)
        .then((response) => {
          const user = response.data.user || {};
          setFormData({
            email: user.email || '',
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            phone: user.phone || '',
            role: user.role || 'user',
          });
        })
        .catch(() => setErrors({ general: 'Ошибка загрузки данных пользователя' }));
    }
  }, [userId]);

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email обязателен';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Неверный формат email';
    if (formData.first_name && formData.first_name.length > 100) newErrors.first_name = 'Имя слишком длинное';
    if (formData.last_name && formData.last_name.length > 100) newErrors.last_name = 'Фамилия слишком длинная';
    if (formData.phone && !/^[0-9+\-() ]+$/.test(formData.phone)) newErrors.phone = 'Неверный формат телефона';
    if (!userId && (!formData.password || formData.password.length < 6)) {
      newErrors.password = 'Пароль обязателен и должен быть не менее 6 символов';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (userId) {
        await api.put(`/users/${userId}`, formData);
      } else {
        await api.post('/users', formData);
      }
      setFormData({ email: '', first_name: '', last_name: '', phone: '', role: 'user', password: '' });
      setErrors({});
      onSave();
    } catch (error) {
      setErrors({ general: error.response?.data?.message || 'Ошибка сохранения пользователя' });
    }
  };
  

  return (
    <div className="form-container">
      <h2>{userId ? 'Редактировать пользователя' : 'Добавить пользователя'}</h2>
      {errors.general && <p className="error">{errors.general}</p>}
      <form onSubmit={handleSubmit}>
  <div className="form-row">
    <div className="form-group">
      <label>Email:</label>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Email"
      />
      {errors.email && <p className="error">{errors.email}</p>}
    </div>

    <div className="form-group">
      <label>Имя:</label>
      <input
        type="text"
        value={formData.first_name}
        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
        placeholder="Имя"
      />
      {errors.first_name && <p className="error">{errors.first_name}</p>}
    </div>

    <div className="form-group button-row">
      <button type="submit">Сохранить</button>
    </div>
  </div>

  <div className="form-row">
    <div className="form-group">
      <label>Роль:</label>
      <select
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
      >
        <option value="user">Пользователь</option>
        <option value="admin">Админ</option>
        <option value="manager">Менеджер</option>
      </select>
    </div>

    <div className="form-group">
      <label>Телефон:</label>
      <input
        type="text"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        placeholder="Телефон"
      />
      {errors.phone && <p className="error">{errors.phone}</p>}
    </div>

    <div className="form-group button-row">
      <button type="button" onClick={onCancel}>Отмена</button>
    </div>
  </div>

  <div className="form-row">
    <div className="form-group">
      <label>Фамилия:</label>
      <input
        type="text"
        value={formData.last_name}
        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
        placeholder="Фамилия"
      />
      {errors.last_name && <p className="error">{errors.last_name}</p>}
    </div>

    {!userId && (
      <div className="form-group">
        <label>Пароль:</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Пароль"
        />
        {errors.password && <p className="error">{errors.password}</p>}
      </div>
    )}
  </div>
</form>
    </div>
  );
}

export default UserForm;