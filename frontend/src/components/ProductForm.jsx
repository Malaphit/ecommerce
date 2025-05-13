import { useState, useEffect } from 'react';
import api from '../services/api';

function ProductForm({ productId, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    description: '',
    available_sizes: {},
    is_active: true,
  });
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    api.get('/categories').then((response) => setCategories(response.data));
    if (productId) {
      api.get(`/products/${productId}`).then((response) => setFormData(response.data));
    }
  }, [productId]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Название обязательно';
    if (formData.name && formData.name.length > 100) newErrors.name = 'Название слишком длинное';
    if (!formData.category_id) newErrors.category_id = 'Категория обязательна';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Цена должна быть больше 0';
    if (formData.description && formData.description.length > 1000) newErrors.description = 'Описание слишком длинное';
    try {
      if (formData.available_sizes && typeof formData.available_sizes !== 'object') {
        JSON.parse(formData.available_sizes);
      }
    } catch {
      newErrors.available_sizes = 'Размеры должны быть в формате JSON';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const payload = { ...formData, available_sizes: JSON.parse(formData.available_sizes || '{}') };
      if (productId) {
        await api.put(`/products/${productId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      onSave();
      setFormData({ name: '', category_id: '', price: '', description: '', available_sizes: {}, is_active: true });
      setErrors({});
    } catch (error) {
      alert('Ошибка сохранения продукта: ' + (error.response?.data?.message || 'Ошибка сервера'));
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
          placeholder="Название продукта"
        />
        {errors.name && <p style={{ color: 'red' }}>{errors.name}</p>}
      </div>
      <div>
        <label>Категория:</label>
        <select
          value={formData.category_id}
          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
        >
          <option value="">Выберите категорию</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.category_id && <p style={{ color: 'red' }}>{errors.category_id}</p>}
      </div>
      <div>
        <label>Цена:</label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          placeholder="Цена"
        />
        {errors.price && <p style={{ color: 'red' }}>{errors.price}</p>}
      </div>
      <div>
        <label>Описание:</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Описание"
        />
        {errors.description && <p style={{ color: 'red' }}>{errors.description}</p>}
      </div>
      <div>
        <label>Размеры (JSON):</label>
        <input
          type="text"
          value={JSON.stringify(formData.available_sizes)}
          onChange={(e) => setFormData({ ...formData, available_sizes: e.target.value })}
          placeholder='{36,37,38}'
        />
        {errors.available_sizes && <p style={{ color: 'red' }}>{errors.available_sizes}</p>}
      </div>
      <div>
        <label>Активен:</label>
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
        />
      </div>
      <button type="submit">Сохранить</button>
    </form>
  );
}

export default ProductForm;