import { useState, useEffect } from 'react';
import api from '../services/api';

function CategoryForm({ categoryId, onSave, onCancel }) {
  const initialState = { name: '', description: '', weight: 0 };
  const [formData, setFormData] = useState(initialState);
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

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      if (categoryId) {
        await api.put(`/categories/${categoryId}`, formData);
      } else {
        await api.post('/categories', formData);
      }
      setFormData(initialState);
      setErrors({});
      onSave();
    } catch (error) {
      setErrors({ general: error.response?.data?.message || 'Ошибка сохранения категории' });
    }
  };

  const handleCancel = () => {
    setFormData(initialState);
    setErrors({});
    if (onCancel) onCancel();
  };

  return (
    <div className="form-container">
      <h2>{categoryId ? 'Редактировать категорию' : 'Добавить категорию'}</h2>
      {errors.general && <p className="error">{errors.general}</p>}

      <form>
  <div className="form-row">
    <div className="form-group">
      <label>Название:</label>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Название категории"
      />
      {errors.name && <p className="error">{errors.name}</p>}
    </div>
    <div className="form-group">
      <label>Вес:</label>
      <input
        type="number"
        value={formData.weight}
        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
        placeholder="Вес категории"
      />
      {errors.weight && <p className="error">{errors.weight}</p>}
    </div>
  </div>

  <div className="form-row">
    <div className="form-group full-width">
      <label>Описание:</label>
      <textarea
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Описание категории"
      />
      {errors.description && <p className="error">{errors.description}</p>}
    </div>
  </div>

  <div className="form-actions">
    <button type="submit" className="save-btn">Сохранить</button>
    <button type="button" className="cancel-btn" onClick={handleCancel}>Отмена</button>
  </div>
</form>
    </div>
  );
}

export default CategoryForm;
