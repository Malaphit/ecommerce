import { useState, useEffect } from 'react';
import api from '../services/api';

function ReferralForm({ referralId, onSave }) {
  const [formData, setFormData] = useState({
    inviter_id: '',
    invited_id: '',
    bonus_awarded: false,
  });
  const [users, setUsers] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get('/users').then((response) => setUsers(response.data));
    if (referralId) {
      api.get(`/referrals/${referralId}`).then((response) => setFormData(response.data));
    }
  }, [referralId]);

  const validate = () => {
    const newErrors = {};
    if (!formData.inviter_id) newErrors.inviter_id = 'Пригласивший обязателен';
    if (!formData.invited_id) newErrors.invited_id = 'Приглашенный обязателен';
    if (formData.inviter_id === formData.invited_id) newErrors.invited_id = 'Пользователи не могут совпадать';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (referralId) {
        await api.put(`/referrals/${referralId}`, formData);
      } else {
        await api.post('/referrals', formData);
      }
      onSave();
      setFormData({ inviter_id: '', invited_id: '', bonus_awarded: false });
      setErrors({});
    } catch (error) {
      alert('Ошибка сохранения реферала: ' + (error.response?.data?.message || 'Ошибка сервера'));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Пригласивший:</label>
        <select
          value={formData.inviter_id}
          onChange={(e) => setFormData({ ...formData, inviter_id: e.target.value })}
        >
          <option value="">Выберите пригласившего</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.email}
            </option>
          ))}
        </select>
        {errors.inviter_id && <p style={{ color: 'red' }}>{errors.inviter_id}</p>}
      </div>
      <div>
        <label>Приглашенный:</label>
        <select
          value={formData.invited_id}
          onChange={(e) => setFormData({ ...formData, invited_id: e.target.value })}
        >
          <option value="">Выберите приглашенного</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.email}
            </option>
          ))}
        </select>
        {errors.invited_id && <p style={{ color: 'red' }}>{errors.invited_id}</p>}
      </div>
      <div>
        <label>Бонус начислен:</label>
        <input
          type="checkbox"
          checked={formData.bonus_awarded}
          onChange={(e) => setFormData({ ...formData, bonus_awarded: e.target.checked })}
        />
      </div>
      <button type="submit">Сохранить</button>
    </form>
  );
}

export default ReferralForm;