import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Carousel from '../components/Carousel';
import ProductCard from '../components/ProductCard';


function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sort, setSort] = useState('price');
  const [order, setOrder] = useState('ASC');
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const params = {
          sort,
          order,
          is_active: true,
        };

        if (categoryFilter) params.category_id = categoryFilter;
        if (search.trim()) params.search = search.trim();
        if (minPrice) params.min_price = minPrice;
        if (maxPrice) params.max_price = maxPrice;
        if (sizeFilter) params.size = sizeFilter;

        const [prodRes, catRes] = await Promise.all([
          api.get('/products', { params }),
          api.get('/categories'),
        ]);

        setProducts(prodRes.data.products || prodRes.data);
        setCategories(catRes.data.categories || catRes.data);

        const uniqueSizes = [
          ...new Set(prodRes.data.products?.flatMap((p) => p.available_sizes || [])),
        ].sort();
        setSizes(uniqueSizes);
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [categoryFilter, sort, order, search, minPrice, maxPrice, sizeFilter]);

  const resetFilters = () => {
    setCategoryFilter('');
    setSort('price');
    setOrder('ASC');
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setSizeFilter('');
  };

  return (
    <div className="page-container">
      <div className="filters">
        <div className="filter-group">
          <label htmlFor="search">Поиск:</label>
          <input id="search" type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Название товара" />
        </div>
        <div className="filter-group">
          <label>Категория:</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Все категории</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Размер:</label>
          <select value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)}>
            <option value="">Все размеры</option>
            {sizes.map((size) => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Цена:</label>
          <div className="price-inputs">
            <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Мин" min="0" />
            <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Макс" min="0" />
          </div>
        </div>
        <div className="filter-group">
          <label>Сортировка:</label>
          <div className="sort-inputs">
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
        <button className="reset-button" onClick={resetFilters}>Сбросить фильтры</button>
      </div>
      <div className="home">
        <Carousel products={products} />
        <div className="banner">
          <h1>Добро пожаловать в <span>Alesandro Vitorio</span>!</h1>
        </div>
        {isLoading ? (
          <p className="loading">Загрузка...</p>
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
    </div>
  );
}

export default Home;
