import React from 'react';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  return (
    <div className="product-card">
      <div className="card-image">
        <img
          src={`${process.env.REACT_APP_API_URL}${product.ProductImages?.[0]?.url || '/placeholder.jpg'}`}
          alt={product.name}
        />
      </div>

      <div className="card-content">
        <h3 className="card-title">{product.name}</h3>
        <p className="card-price">{product.price} ₽</p>
        <button
          className="card-button"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          Подробнее
        </button>
      </div>
    </div>
  );
};

export default ProductCard;