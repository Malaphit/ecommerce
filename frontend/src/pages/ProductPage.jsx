import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

const ProductPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedImage((prevIndex) =>
        product?.ProductImages?.length
          ? (prevIndex + 1) % product.ProductImages.length
          : 0
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [product]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Пожалуйста, войдите в аккаунт');
      navigate('/login');
      return;
    }
    if (!selectedSize) {
      toast.error('Пожалуйста, выберите размер');
      return;
    }
    if (quantity < 1 || quantity > 3) {
      toast.error('Можно добавить от 1 до 3 штук');
      return;
    }
  
    try {
      const res = await api.get('/cart');
      const cartItems = Array.isArray(res.data.items) ? res.data.items : [];

      const existingItem = cartItems.find(
        (item) => item.product_id === product.id && item.size === selectedSize
      );
  
      if (existingItem && existingItem.quantity + quantity > 3) {
        toast.error(`В корзине уже ${existingItem.quantity} шт. Максимум — 3`);
        return;
      }
  
      await api.post('/cart', {
        product_id: product.id,
        size: selectedSize,
        quantity,
      });
  
      toast.success('Товар добавлен в корзину');
      navigate('/cart');
    } catch (err) {
      console.error('Ошибка добавления в корзину:', err.response?.data);
      toast.error(err.response?.data?.message || 'Ошибка добавления в корзину');
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
          <p>Категория: {product.Category?.name || 'Не указана'}</p>
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
          <div className="quantity-selector">
            <label>Количество:</label>
            <input
              type="number"
              min="1"
              max="3"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
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