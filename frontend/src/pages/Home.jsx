import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Carousel from '../components/Carousel';
import ProductCard from '../components/ProductCard';

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState('price');
  const [order, setOrder] = useState('ASC');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get(`/products?category_id=${categoryFilter}&sort=${sort}&order=${order}&is_active=true`),
          api.get('/categories'),
        ]);
        setProducts(prodRes.data.products || prodRes.data);
        setCategories(catRes.data.categories || catRes.data);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [categoryFilter, sort, order]);

  return (
    <div className="home">
      <Carousel products={products} />
      <h1>Добро пожаловать в Alesandro Vitorio!</h1>
      <div className="filters">
        <div className="filter-group">
          <label>Категория:</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Все категории</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Сортировка:</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="price">По цене</option>
            <option value="name">По названию</option>
          </select>
          <select value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="ASC">По возрастанию</option>
            <option value="DESC">По убыванию</option>
          </select>
        </div>
      </div>
      {isLoading ? (
        <p>Загрузка...</p>
      ) : (
        <div className="products-list">
          {products.length === 0 ? (
            <p>Товары отсутствуют</p>
          ) : (
            products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Home;