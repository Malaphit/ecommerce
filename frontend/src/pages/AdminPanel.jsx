import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import ProductForm from '../components/ProductForm';
import CategoryForm from '../components/CategoryForm';
import OrderForm from '../components/OrderForm';
import UserForm from '../components/UserForm';

function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [productPage, setProductPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [productPagination, setProductPagination] = useState({ total: 0, pages: 1 });
  const [categoryPagination, setCategoryPagination] = useState({ total: 0, pages: 1 });
  const [userPagination, setUserPagination] = useState({ total: 0, pages: 1 });
  const [orderPagination, setOrderPagination] = useState({ total: 0, pages: 1 });
  const [productSort, setProductSort] = useState('price');
  const [productOrder, setProductOrder] = useState('ASC');
  const [orderSort, setOrderSort] = useState('created_at');
  const [orderOrder, setOrderOrder] = useState('DESC');
  const [editProductId, setEditProductId] = useState(null);
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editOrderId, setEditOrderId] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('products');
  const limit = 10;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes, ordRes, userRes] = await Promise.all([
        api.get(
          `/products?page=${productPage}&limit=${limit}&sort=${productSort}&order=${productOrder}&category_id=${categoryFilter}&is_active=${
            showInactive ? '' : 'true'
          }`
        ),
        api.get(`/categories?page=${categoryPage}&limit=${limit}`),
        api.get(`/orders?status=${orderStatusFilter}&page=${orderPage}&limit=${limit}&sort=${orderSort}&order=${orderOrder}`),
        api.get(`/users?email=${userSearch}&page=${userPage}&limit=${limit}`),
      ]);

      const prodData = prodRes.data.products || prodRes.data;
      setProducts(Array.isArray(prodData) ? prodData : []);
      const newProductPagination = { total: prodRes.data.total || 0, pages: prodRes.data.pages || 1 };
      setProductPagination(newProductPagination);
      if (productPage > newProductPagination.pages && newProductPagination.pages > 0) {
        setProductPage(newProductPagination.pages);
      }

      const catData = catRes.data.categories || catRes.data;
      setCategories(Array.isArray(catData) ? catData : []);
      const newCategoryPagination = { total: catRes.data.total || 0, pages: catRes.data.pages || 1 };
      setCategoryPagination(newCategoryPagination);
      if (categoryPage > newCategoryPagination.pages && newCategoryPagination.pages > 0) {
        setCategoryPage(newCategoryPagination.pages);
      }

      const ordData = ordRes.data.orders || ordRes.data;
      setOrders(Array.isArray(ordData) ? ordData : []);
      const newOrderPagination = { total: ordRes.data.total || 0, pages: ordRes.data.pages || 1 };
      setOrderPagination(newOrderPagination);
      if (orderPage > newOrderPagination.pages && newOrderPagination.pages > 0) {
        setOrderPage(newOrderPagination.pages);
      }

      const userData = userRes.data.users || userRes.data;
      setUsers(Array.isArray(userData) ? userData : []);
      const newUserPagination = { total: userRes.data.total || 0, pages: userRes.data.pages || 1 };
      setUserPagination(newUserPagination);
      if (userPage > newUserPagination.pages && newUserPagination.pages > 0) {
        setUserPage(newUserPagination.pages);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
      });
      toast.error('Ошибка загрузки данных: ' + (error.response?.data?.message || 'Ошибка сервера'));
    } finally {
      setIsLoading(false);
    }
  }, [
    productPage,
    categoryPage,
    orderPage,
    userPage,
    productSort,
    productOrder,
    orderSort,
    orderOrder,
    orderStatusFilter,
    userSearch,
    categoryFilter,
    showInactive,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (endpoint, id) => {
    try {
      await api.delete(`${endpoint}/${id}`);
      toast.success('Элемент успешно удалён');
      fetchData();
    } catch (error) {
      console.error('Ошибка удаления:', {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
      });
      toast.error('Ошибка удаления: ' + (error.response?.data?.message || 'Ошибка сервера'));
    }
  };

  const handleEdit = (type, id) => {
    switch (type) {
      case 'product':
        setEditProductId(id === editProductId ? null : id);
        break;
      case 'category':
        setEditCategoryId(id === editCategoryId ? null : id);
        break;
      case 'order':
        setEditOrderId(id === editOrderId ? null : id);
        break;
      case 'user':
        setEditUserId(id === editUserId ? null : id);
        break;
      default:
        break;
    }
  };

  const handleSave = () => {
    setEditProductId(null);
    setEditCategoryId(null);
    setEditOrderId(null);
    setEditUserId(null);
    toast.success('Изменения сохранены');
    fetchData();
  };

  const renderItem = (type, item, editId, FormComponent, formProps) => {
    const isEditing = item.id === editId;
    return (
      <li key={item.id} className="admin-item">
        {isEditing ? (
          <FormComponent {...formProps} onSave={handleSave} />
        ) : (
          <>
            {type === 'product' && (
              <div className="admin-item-content">
                <img
                  src={`${process.env.REACT_APP_API_URL}${item.ProductImages?.[0]?.url || '/placeholder.jpg'}`}
                  alt="preview"
                  className="admin-item-image"
                />
                <div>
                  <strong>{item.name}</strong> – {item.price}₽{' '}
                  [{item.is_active ? '🟢 Активен' : '🔴 Неактивен'}]
                  <br />
                  Категория: {item.Category?.name || 'Без категории'}
                  <br />
                  Размеры: {item.available_sizes.join(', ') || 'Нет размеров'}
                </div>
              </div>
            )}
            {type === 'category' && `${item.name}`}
            {type === 'order' && `Заказ #${item.id} - Пользователь: ${item.User?.email || 'Не указан'} - Статус: ${item.status} - Сумма: ${item.total_price} ₽`}
            {type === 'user' && `${item.email} - ${item.role}`}
            <div className="admin-item-actions">
              <button onClick={() => handleEdit(type, item.id)}>
                {isEditing ? 'Отмена' : 'Редактировать'}
              </button>
              <button onClick={() => handleDelete(`/${type}s`, item.id)}>Удалить</button>
            </div>
          </>
        )}
      </li>
    );
  };

  const renderPagination = (currentPage, setPage, pagination, isLoading) => {
    if (pagination.pages <= 1) return null;
    return (
      <div className="pagination">
        <button disabled={currentPage === 1 || isLoading} onClick={() => setPage(currentPage - 1)}>
          Назад
        </button>
        <span>Страница {currentPage} из {pagination.pages}</span>
        <button
          disabled={currentPage === pagination.pages || isLoading}
          onClick={() => setPage(currentPage + 1)}
        >
          Вперед
        </button>
      </div>
    );
  };

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <div className="sidebar">
          <div
            className={`sidebar-item ${activeSection === 'products' ? 'active' : ''}`}
            onClick={() => setActiveSection('products')}
          >
            Продукты
          </div>
          <div
            className={`sidebar-item ${activeSection === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveSection('categories')}
          >
            Категории
          </div>
          <div
            className={`sidebar-item ${activeSection === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveSection('orders')}
          >
            Заказы
          </div>
          <div
            className={`sidebar-item ${activeSection === 'users' ? 'active' : ''}`}
            onClick={() => setActiveSection('users')}
          >
            Пользователи
          </div>
        </div>
        <div className="admin-content">
          <h1>Админ-панель</h1>
          {isLoading && <p className="loading">Загрузка...</p>}

          {activeSection === 'products' && (
            <>
              <h2>Продукты</h2>
              <div className="admin-filters">
                <div>
                  <label>Фильтр по категории:</label>
                  <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                    <option value="">Все категории</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Сортировка:</label>
                  <select value={productSort} onChange={(e) => setProductSort(e.target.value)}>
                    <option value="price">По цене</option>
                    <option value="name">По названию</option>
                    <option value="created_at">По дате</option>
                  </select>
                  <select value={productOrder} onChange={(e) => setProductOrder(e.target.value)}>
                    <option value="ASC">По возрастанию</option>
                    <option value="DESC">По убыванию</option>
                  </select>
                </div>
                <div>
                  <label>
                    <input
                      type="checkbox"
                      checked={showInactive}
                      onChange={(e) => setShowInactive(e.target.checked)}
                    />
                    Показывать неактивные товары
                  </label>
                </div>
              </div>
              <ProductForm onSave={handleSave} />
              {products.length === 0 ? (
                <p>Продукты отсутствуют</p>
              ) : (
                <ul className="admin-list">
                  {products.map((product) =>
                    renderItem('product', product, editProductId, ProductForm, { productId: product.id })
                  )}
                </ul>
              )}
              {renderPagination(productPage, setProductPage, productPagination, isLoading)}
            </>
          )}

          {activeSection === 'categories' && (
            <>
              <h2>Категории</h2>
              <CategoryForm onSave={handleSave} />
              {categories.length === 0 ? (
                <p>Категории отсутствуют</p>
              ) : (
                <ul className="admin-list">
                  {categories.map((category) =>
                    renderItem('category', category, editCategoryId, CategoryForm, { categoryId: category.id })
                  )}
                </ul>
              )}
              {renderPagination(categoryPage, setCategoryPage, categoryPagination, isLoading)}
            </>
          )}

          {activeSection === 'orders' && (
            <>
              <h2>Заказы</h2>
              <div className="admin-filters">
                <div>
                  <label>Фильтр по статусу:</label>
                  <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
                    <option value="">Все</option>
                    <option value="pending">В обработке</option>
                    <option value="shipped">Отправлен</option>
                    <option value="delivered">Доставлен</option>
                    <option value="cancelled">Отменен</option>
                  </select>
                </div>
                <div>
                  <label>Сортировка:</label>
                  <select value={orderSort} onChange={(e) => setOrderSort(e.target.value)}>
                    <option value="created_at">По дате</option>
                    <option value="total_price">По сумме</option>
                  </select>
                  <select value={orderOrder} onChange={(e) => setOrderOrder(e.target.value)}>
                    <option value="ASC">По возрастанию</option>
                    <option value="DESC">По убыванию</option>
                  </select>
                </div>
              </div>
              {orders.length === 0 ? (
                <p>Заказы отсутствуют</p>
              ) : (
                <ul className="admin-list">
                  {orders.map((order) =>
                    renderItem('order', order, editOrderId, OrderForm, { orderId: order.id })
                  )}
                </ul>
              )}
              {renderPagination(orderPage, setOrderPage, orderPagination, isLoading)}
            </>
          )}

          {activeSection === 'users' && (
            <>
              <h2>Пользователи</h2>
              <div className="admin-filters">
                <div>
                  <label>Поиск по email:</label>
                  <input
                    type="text"
                    value={userSearch || ''}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Введите email"
                  />
                </div>
              </div>
              <UserForm onSave={handleSave} />
              {users.length === 0 ? (
                <p>Пользователи отсутствуют</p>
              ) : (
                <ul className="admin-list">
                  {users.map((user) =>
                    renderItem('user', user, editUserId, UserForm, { userId: user.id })
                  )}
                </ul>
              )}
              {renderPagination(userPage, setUserPage, userPagination, isLoading)}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;