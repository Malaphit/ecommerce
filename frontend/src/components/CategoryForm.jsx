import { useState, useEffect } from 'react';
import api from '../services/api';

function CategoryForm({ categoryId, onSave }) {
  const [formData, setFormData] = useState({ name: '', description: '', weight: 0 });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (categoryId) {
      api
        .get(`/categories/${categoryId}`)
        .then((response) => {
          const data = response.data.category || response.data;
          setFormData({
            name: data.name || '',
            description: data.description || '',
            weight: data.weight || 0,
          });
        })
        .catch(() => setErrors({ general: 'Ошибка загрузки категории' }));
    }
  }, [categoryId]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Название обязательно';
    if (formData.name.length > 100) newErrors.name = 'Название слишком длинное';
    if (formData.description.length > 500) newErrors.description = 'Описание слишком длинное';
    if (isNaN(formData.weight)) newErrors.weight = 'Вес должен быть числом';
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
      setFormData({ name: '', description: '', weight: 0 });
      setErrors({});
      onSave();
    } catch (error) {
      setErrors({ general: error.response?.data?.message || 'Ошибка сохранения категории' });
    }
  };

  return (
    <div className="form-container">
      <h2>{categoryId ? 'Редактировать категорию' : 'Добавить категорию'}</h2>
      {errors.general && <p className="error">{errors.general}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Название:</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Название категории"
          />
          {errors.name && <p className="error">{errors.name}</p>}
        </div>
        <div>
          <label>Описание:</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Описание категории"
          />
          {errors.description && <p className="error">{errors.description}</p>}
        </div>
        <div>
          <label>Вес:</label>
          <input
            type="number"
            value={formData.weight || 0}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
            placeholder="Вес категории"
          />
          {errors.weight && <p className="error">{errors.weight}</p>}
        </div>
        <button type="submit">Сохранить</button>
      </form>
    </div>
  );
}

export default CategoryForm;