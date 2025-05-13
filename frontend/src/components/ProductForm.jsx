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
    images: [],
  });
  const [files, setFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [draggingIndex, setDraggingIndex] = useState(null);

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
            images: data.ProductImages || [],
          });
        }
      } catch (error) {
        setErrors({ general: error.response?.data?.message || 'Ошибка загрузки данных' });
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
      const payload = {
        name: formData.name,
        category_id: formData.category_id,
        price: parseFloat(formData.price),
        description: formData.description,
        available_sizes: formData.available_sizes,
        is_active: formData.is_active,
      };
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
        const prodRes = await api.get(`/products/${product.data.id}`);
        setFormData((prev) => ({
          ...prev,
          images: prodRes.data.ProductImages || [],
        }));
      }

      setFormData({
        name: '',
        category_id: '',
        price: '',
        description: '',
        available_sizes: [],
        is_active: true,
        images: [],
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
    if (selectedFiles.length + files.length + formData.images.length > 10) {
      setErrors({ files: 'Максимум 10 изображений' });
      return;
    }
    setFiles([...files, ...selectedFiles]);
    setErrors((prev) => ({ ...prev, files: null }));
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDeleteImage = async (imageId) => {
    if (!productId) return;
    try {
      await api.delete(`/products/${productId}/images/${imageId}`);
      const prodRes = await api.get(`/products/${productId}`);
      setFormData((prev) => ({
        ...prev,
        images: prodRes.data.ProductImages || [],
      }));
      setErrors((prev) => ({ ...prev, images: null }));
    } catch (error) {
      setErrors({ images: error.response?.data?.message || 'Ошибка удаления изображения' });
    }
  };

  const handleDragStart = (index) => {
    setDraggingIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = async (index) => {
    if (draggingIndex === null || draggingIndex === index) return;
    const newImages = [...formData.images];
    const [draggedImage] = newImages.splice(draggingIndex, 1);
    newImages.splice(index, 0, draggedImage);
    setFormData((prev) => ({ ...prev, images: newImages }));

    try {
      const positions = newImages.map((img, i) => ({ id: img.id, position: i }));
      await api.put(`/products/${productId}/images/positions`, { positions });
    } catch (error) {
      setErrors({ images: error.response?.data?.message || 'Ошибка обновления порядка изображений' });
      const prodRes = await api.get(`/products/${productId}`);
      setFormData((prev) => ({
        ...prev,
        images: prodRes.data.ProductImages || [],
      }));
    }
    setDraggingIndex(null);
  };

  const sizes = Array.from({ length: 13 }, (_, i) => 36 + i);

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
            <>
              <h3>Предпросмотр новых изображений</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '10px',
                  marginBottom: '10px',
                }}
              >
                {files.map((file, index) => (
                  <div key={index} style={{ textAlign: 'center' }}>
                    <img
                      src={URL.createObjectURL(file)}
                      alt="Preview"
                      style={{ width: '100px', height: 'auto', objectFit: 'cover' }}
                    />
                    <p style={{ fontSize: '12px', wordBreak: 'break-all' }}>{file.name}</p>
                    <button type="button" onClick={() => removeFile(index)}>
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
          {errors.files && <p style={{ color: 'red' }}>{errors.files}</p>}
          {formData.images.length > 0 && (
            <>
              <h3>Текущие изображения</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '10px',
                }}
              >
                {formData.images.map((img, index) => (
                  <div
                    key={img.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    style={{
                      textAlign: 'center',
                      cursor: 'move',
                      background: draggingIndex === index ? '#f0f0f0' : 'transparent',
                    }}
                  >
                    <img
                      src={`${process.env.REACT_APP_API_URL}${img.url}`}
                      alt="Product"
                      style={{ width: '100px', height: 'auto', objectFit: 'cover' }}
                    />
                    <button type="button" onClick={() => handleDeleteImage(img.id)}>
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
              {errors.images && <p style={{ color: 'red' }}>{errors.images}</p>}
            </>
          )}
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