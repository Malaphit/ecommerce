import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);
        setProduct(response.data);
        setIsLoading(false);
      } catch (err) {
        setError('Ошибка загрузки товара');
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    if (!selectedSize) {
      alert('Пожалуйста, выберите размер');
      return;
    }
    try {
      await api.post('/cart', {
        product_id: product.id,
        size: selectedSize,
        quantity: 1,
      });
      alert('Товар добавлен в корзину');
    } catch (err) {
      alert('Ошибка добавления в корзину: ' + (err.response?.data?.message || 'Ошибка сервера'));
    }
  };

  if (isLoading) {
    return <div className="product-detail">Загрузка...</div>;
  }

  if (error || !product) {
    return <div className="product-detail">Товар не найден</div>;
  }

  return (
    <div className="product-detail">
      <h1>{product.name}</h1>
      <div className="product-content">
        <div className="product-images">
          <img
            src={`${process.env.REACT_APP_API_URL}${product.ProductImages?.[selectedImage]?.url || '/placeholder.jpg'}`}
            alt={product.name}
            className="main-image"
          />
          {product.ProductImages?.length > 1 && (
            <div className="thumbnail-gallery">
              {product.ProductImages.map((img, index) => (
                <img
                  key={img.id}
                  src={`${process.env.REACT_APP_API_URL}${img.url}`}
                  alt={`${product.name} ${index + 1}`}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="product-info">
          <p>Цена: <span className="product-price">{product.price} ₽</span></p>
          <p>Описание: {product.description || 'Нет описания'}</p>
          <p>Категория: {product.category_name || 'Не указана'}</p>
          <div className="size-selector">
            <label>Размер:</label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              <option value="">Выберите размер</option>
              {product.available_sizes?.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleAddToCart} className="add-to-cart">
            Добавить в корзину
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;