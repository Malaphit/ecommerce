import { useState, useEffect } from 'react';
import api from '../services/api';

function ProductForm({ productId, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    description: '',
    available_sizes: [],
    is_active: true,
  });
  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const catRes = await api.get('/categories');
        const categoryList = catRes.data.categories || catRes.data || [];
        setCategories(Array.isArray(categoryList) ? categoryList : []);
        if (productId) {
          const prodRes = await api.get(`/products/${productId}`);
          const data = prodRes.data.product || prodRes.data; 
          setFormData({
            category_id: data.category_id || '',
            name: data.name || '',
            description: data.description || '',
            price: data.price || '',
            available_sizes: data.available_sizes || [],
            is_active: data.is_active !== undefined ? data.is_active : true,
          });
        }
      } catch (error) {
        setErrors({ general: 'Ошибка загрузки данных' });
      }
    };
    fetchData();
  }, [productId]);

  const validate = () => {
    const newErrors = {};
    if (!formData.category_id) newErrors.category_id = 'Категория обязательна';
    if (!formData.name) newErrors.name = 'Название обязательно';
    if (formData.name && formData.name.length > 100) newErrors.name = 'Название слишком длинное';
    if (!formData.price || formData.price <= 0) newErrors.price = 'Цена должна быть больше 0';
    if (formData.description && formData.description.length > 1000) newErrors.description = 'Описание слишком длинное';
    if (formData.available_sizes.length === 0) newErrors.available_sizes = 'Выберите хотя бы один размер';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const payload = { ...formData };
      let product;
      if (productId) {
        product = await api.put(`/products/${productId}`, payload);
      } else {
        product = await api.post('/products', payload);
      }

      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => formData.append('images', file));
        await api.post(`/products/${product.data.id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setFormData({
        category_id: '',
        name: '',
        description: '',
        price: '',
        available_sizes: [],
        is_active: true,
      });
      setFiles([]);
      setErrors({});
      onSave();
    } catch (error) {
      setErrors({ general: error.response?.data?.message || 'Ошибка сохранения продукта' });
    }
  };

  const handleSizeChange = (size) => {
    setFormData((prev) => ({
      ...prev,
      available_sizes: prev.available_sizes.includes(size)
        ? prev.available_sizes.filter((s) => s !== size)
        : [...prev.available_sizes, size],
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 10) {
      setErrors({ files: 'Максимум 10 изображений' });
      return;
    }
    setFiles([...files, ...selectedFiles]);
    setErrors((prev) => ({ ...prev, files: null }));
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const sizes = Array.from({ length: 13 }, (_, i) => 36 + i); // 36–48

  return (
    <div>
      <h2>{productId ? 'Редактировать товар' : 'Добавить товар'}</h2>
      {errors.general && <p style={{ color: 'red' }}>{errors.general}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Категория:</label>
          <select
            value={formData.category_id || ''}
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
          <label>Название:</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Название продукта"
          />
          {errors.name && <p style={{ color: 'red' }}>{errors.name}</p>}
        </div>
        <div>
          <label>Описание:</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Описание"
          />
          {errors.description && <p style={{ color: 'red' }}>{errors.description}</p>}
        </div>
        <div>
          <label>Цена:</label>
          <input
            type="number"
            step="0.01"
            value={formData.price || ''}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="Цена"
          />
          {errors.price && <p style={{ color: 'red' }}>{errors.price}</p>}
        </div>
        <div>
          <label>Размеры:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {sizes.map((size) => (
              <label key={size}>
                <input
                  type="checkbox"
                  checked={formData.available_sizes.includes(size)}
                  onChange={() => handleSizeChange(size)}
                />
                {size}
              </label>
            ))}
          </div>
          {errors.available_sizes && <p style={{ color: 'red' }}>{errors.available_sizes}</p>}
        </div>
        <div>
          <label>Изображения (до 10):</label>
          <input type="file" multiple accept="image/*" onChange={handleFileChange} />
          {files.length > 0 && (
            <ul>
              {files.map((file, index) => (
                <li key={index}>
                  {file.name}
                  <button type="button" onClick={() => removeFile(index)}>
                    Удалить
                  </button>
                </li>
              ))}
            </ul>
          )}
          {errors.files && <p style={{ color: 'red' }}>{errors.files}</p>}
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
    </div>
  );
}

export default ProductForm;