import { useState, useEffect } from 'react';
import api from '../services/api';
import { Range } from 'react-range';

function ProductForm({ productId, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    description: '',
    size_range: [36, 48], // [minSize, maxSize]
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
          const sizes = data.available_sizes || [36, 48];
          setFormData({
            category_id: data.category_id || '',
            name: data.name || '',
            description: data.description || '',
            price: data.price || '',
            size_range: [Math.min(...sizes), Math.max(...sizes)],
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
    if (formData.size_range[0] < 36 || formData.size_range[1] > 48 || formData.size_range[0] > formData.size_range[1]) {
      newErrors.size_range = 'Неверный диапазон размеров (36–48)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const available_sizes = Array.from(
        { length: formData.size_range[1] - formData.size_range[0] + 1 },
        (_, i) => formData.size_range[0] + i
      );
      const payload = {
        name: formData.name,
        category_id: formData.category_id,
        price: parseFloat(formData.price),
        description: formData.description,
        available_sizes,
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
        size_range: [36, 48],
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

  return (
    <div className="form-container">
      <h2>{productId ? 'Редактировать товар' : 'Добавить товар'}</h2>
      {errors.general && <p className="error">{errors.general}</p>}
      <form>
        <div className="form-level-1 form-row">
          <div className="form-group">
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
            {errors.category_id && <p className="error">{errors.category_id}</p>}
          </div>
          <div className="form-group">
            <label>Название:</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Название продукта"
            />
            {errors.name && <p className="error">{errors.name}</p>}
          </div>
        </div>
        <div className="form-level-2 form-row">
          <div className="form-group">
            <label>Описание:</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Описание"
            />
            {errors.description && <p className="error">{errors.description}</p>}
          </div>
        </div>
        <div className="form-level-3 form-row">
          <div className="form-group">
            <label>Цена:</label>
            <input
              type="number"
              step="0.01"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Цена"
            />
            {errors.price && <p className="error">{errors.price}</p>}
          </div>
          <div className="form-group form-checkbox">
            <label>Активен:</label>
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            />
          </div>
        </div>
        <div className="form-level-4 form-row">
          <div className="form-group">
            <label>Диапазон размеров (36–48):</label>
            <div className="size-range-container">
              <Range
                step={1}
                min={36}
                max={48}
                values={formData.size_range}
                onChange={(values) => setFormData({ ...formData, size_range: values })}
                renderTrack={({ props, children }) => (
                  <div
                    {...props}
                    className="range-track"
                    style={{
                      ...props.style,
                      height: '6px',
                      width: '100%',
                      background: `linear-gradient(to right, #E5E5E5 ${
                        ((formData.size_range[0] - 36) / (48 - 36)) * 100
                      }%, #F7452C ${
                        ((formData.size_range[0] - 36) / (48 - 36)) * 100
                      }%, #F7452C ${
                        ((formData.size_range[1] - 36) / (48 - 36)) * 100
                      }%, #E5E5E5 ${
                        ((formData.size_range[1] - 36) / (48 - 36)) * 100
                      }%)`,
                    }}
                  >
                    {children}
                  </div>
                )}
                renderThumb={({ props, index }) => (
                  <div
                    {...props}
                    className="range-thumb"
                    style={{
                      ...props.style,
                      height: '16px',
                      width: '16px',
                      backgroundColor: '#F7452C',
                      border: '2px solid #FFFFFF',
                      borderRadius: '50%',
                    }}
                  />
                )}
              />
              <div>
                <span>{formData.size_range[0]}<span>\</span>{formData.size_range[1]}</span>
              </div>
            </div>
            {errors.size_range && <p className="error">{errors.size_range}</p>}
          </div>
        </div>
      </form>
      <div className="form-level-5">
        <div className="form-group images-group">
          <label>Изображения (до 10):</label>
          <input type="file" multiple accept="image/*" onChange={handleFileChange} />
          {files.length > 0 && (
            <>
              <h3>Предпросмотр новых изображений</h3>
              <div className="images-container horizontal">
                {files.map((file, index) => (
                  <div key={index} className="image-preview">
                    <img src={URL.createObjectURL(file)} alt="Preview" />
                    <button
                      type="button"
                      className="image-delete"
                      onClick={() => removeFile(index)}
                    >
                      ✕
                    </button>
                    <p>{file.name}</p>
                  </div>
                ))}
              </div>
            </>
          )}
          {errors.files && <p className="error">{errors.files}</p>}
          {formData.images.length > 0 && (
            <>
              <h3>Текущие изображения</h3>
              <div className="images-container horizontal">
                {formData.images.map((img, index) => (
                  <div
                    key={img.id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    className={`image-preview ${draggingIndex === index ? 'dragging' : ''}`}
                  >
                    <img src={`${process.env.REACT_APP_API_URL}${img.url}`} alt="Product" />
                    <button
                      type="button"
                      className="image-delete"
                      onClick={() => handleDeleteImage(img.id)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {errors.images && <p className="error">{errors.images}</p>}
            </>
          )}
        </div>
      </div>
      <button type="submit" onClick={handleSubmit}>Сохранить</button>
    </div>
  );
}

export default ProductForm;