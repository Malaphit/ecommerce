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

  useEffect(() => {
    api.get('/categories').then((response) => setCategories(response.data));
    if (productId) {
      api.get(`/products/${productId}`).then((response) => setFormData(response.data));
    }
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (productId) {
        await api.put(`/products/${productId}`, formData);
      } else {
        await api.post('/products', formData);
      }
      onSave();
    } catch (error) {
      alert('Ошибка сохранения продукта');
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
      <input
        type="number"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        placeholder="Цена"
      />
      <textarea
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Описание"
      />
      <input
        type="text"
        value={JSON.stringify(formData.available_sizes)}
        onChange={(e) => setFormData({ ...formData, available_sizes: JSON.parse(e.target.value) })}
        placeholder="Размеры (JSON)"
      />
      <label>
        Активен:
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
        />
      </label>
      <button type="submit">Сохранить</button>
    </form>
  );
}

export default ProductForm;