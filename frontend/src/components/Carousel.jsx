import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Carousel = ({ products = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const shuffled = [...products].sort(() => 0.5 - Math.random()).slice(0, 3);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === shuffled.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [shuffled.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? shuffled.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === shuffled.length - 1 ? 0 : prev + 1));
  };

  if (shuffled.length === 0) {
    return <div className="carousel">Нет товаров для отображения</div>;
  }

  return (
    <div className="carousel">
      <div className="carousel-wrapper">
        <div
          className="carousel-slides"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {shuffled.map((product) => (
            <div key={product.id} className="carousel-slide">
              <div className="slide-image">
                <img
                  src={`${process.env.REACT_APP_API_URL}${product.ProductImages?.[0]?.url || '/placeholder.jpg'}`}
                  alt={product.name}
                />
              </div>
              <div className="slide-content">
                <h2 className="slide-title">{product.name}</h2>
                <p className="slide-description">{product.description}</p>
                <div className="slide-footer">
                  <span className="slide-price">{product.price} ₽</span>
                  <button
                    className="slide-button"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="carousel-controls">
        <button className="control-prev" onClick={handlePrev} aria-label="Предыдущий слайд">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
        <button className="control-next" onClick={handleNext} aria-label="Следующий слайд">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
          </svg>
        </button>
      </div>

      <div className="carousel-indicators">
        {shuffled.map((_, index) => (
          <span
            key={index}
            className={`indicator-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Показать слайд ${index + 1}`}
            tabIndex={0}
          ></span>
        ))}
      </div>
    </div>
  );
};

export default Carousel;
