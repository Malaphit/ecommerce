import { useState, useEffect } from 'react';
import api from '../services/api';

function CategoryForm({ categoryId, onSave }) {
  const [formData, setFormData] = useState({ name: '', description: '', weight: 0 });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (categoryId) {
      api.get(`/categories/${categoryId}`)
        .then((response) => setFormData(response.data))
        .catch(() => alert('Ошибка загрузки категории'));
    }
  }, [categoryId]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Название обязательно';
    if (formData.name && formData.name.length > 100) newErrors.name = 'Название слишком длинное';
    if (formData.description && formData.description.length > 500) newErrors.description = 'Описание слишком длинное';
    if (formData.weight && isNaN(formData.weight)) newErrors.weight = 'Вес должен быть числом';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (categoryId) {
        await api.put(`/categories/${categoryId}`, formData);
      } else {
        await api.post('/categories', formData);
      }
      onSave();
      setFormData({ name: '', description: '', weight: 0 });
      setErrors({});
    } catch (error) {
      alert('Ошибка сохранения категории: ' + (error.response?.data?.message || 'Ошибка сервера'));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Название:</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Название категории"
        />
        {errors.name && <p style={{ color: 'red' }}>{errors.name}</p>}
      </div>
      <div>
        <label>Описание:</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Описание категории"
        />
        {errors.description && <p style={{ color: 'red' }}>{errors.description}</p>}
      </div>
      <div>
        <label>Вес:</label>
        <input
          type="number"
          value={formData.weight}
          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
          placeholder="Вес категории"
        />
        {errors.weight && <p style={{ color: 'red' }}>{errors.weight}</p>}
      </div>
      <button type="submit">Сохранить</button>
    </form>
  );
}

export default CategoryForm;