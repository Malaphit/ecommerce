import { useState, useEffect } from 'react';
import api from '../services/api';

function CategoryForm({ categoryId, onSave }) {
  const [formData, setFormData] = useState({ name: '', description: '', weight: 0 });

  useEffect(() => {
    if (categoryId) {
      api.get(`/categories/${categoryId}`).then((response) => setFormData(response.data));
    }
  }, [categoryId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (categoryId) {
        await api.put(`/categories/${categoryId}`, formData);
      } else {
        await api.post('/categories', formData);
      }
      onSave();
    } catch (error) {
      alert('Ошибка сохранения категории');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Название"
      />
      <textarea
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Описание"
      />
      <input
        type="number"
        value={formData.weight}
        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
        placeholder="Вес"
      />
      <button type="submit">Сохранить</button>
    </form>
  );
}

export default CategoryForm;