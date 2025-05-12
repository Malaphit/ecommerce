import { useState, useEffect } from 'react';
import api from '../services/api';

function ReferralForm({ referralId, onSave }) {
  const [formData, setFormData] = useState({
    inviter_id: '',
    invited_id: '',
    bonus_awarded: false,
  });
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.get('/users').then((response) => setUsers(response.data));
    if (referralId) {
      api.get(`/referrals/${referralId}`).then((response) => setFormData(response.data));
    }
  }, [referralId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (referralId) {
        await api.put(`/referrals/${referralId}`, formData);
      } else {
        await api.post('/referrals', formData);
      }
      onSave();
    } catch (error) {
      alert('Ошибка сохранения реферала');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <select
        value={formData.inviter_id}
        onChange={(e) => setFormData({ ...formData, inviter_id: e.target.value })}
        required
      >
        <option value="">Выберите пригласившего</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.email}
          </option>
        ))}
      </select>
      <select
        value={formData.invited_id}
        onChange={(e) => setFormData({ ...formData, invited_id: e.target.value })}
        required
      >
        <option value="">Выберите приглашенного</option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.email}
          </option>
        ))}
      </select>
      <label>
        Бонус начислен:
        <input
          type="checkbox"
          checked={formData.bonus_awarded}
          onChange={(e) => setFormData({ ...formData, bonus_awarded: e.target.checked })}
        />
      </label>
      <button type="submit">Сохранить</button>
    </form>
  );
}

export default ReferralForm;