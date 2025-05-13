import { useState, useEffect, useCallback } from 'react';
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
  const limit = 10;

  const fetchData = useCallback(async () => {
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
      setProducts(prodRes.data.products || prodRes.data);
      setProductPagination({ total: prodRes.data.total, pages: prodRes.data.pages });
      setCategories(catRes.data.categories || catRes.data);
      setCategoryPagination({ total: catRes.data.total, pages: catRes.data.pages });
      setOrders(ordRes.data.orders || ordRes.data);
      setOrderPagination({ total: ordRes.data.total, pages: ordRes.data.pages });
      setUsers(userRes.data.users || userRes.data);
      setUserPagination({ total: userRes.data.total, pages: userRes.data.pages });
    } catch (error) {
      alert('Ошибка загрузки данных: ' + (error.response?.data?.message || 'Ошибка сервера'));
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
      fetchData();
    } catch (error) {
      alert('Ошибка удаления: ' + (error.response?.data?.message || 'Ошибка сервера'));
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
    fetchData();
  };

  const renderItem = (type, item, editId, FormComponent, formProps) => {
    const isEditing = item.id === editId;
    return (
      <li key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        {isEditing ? (
          <FormComponent {...formProps} onSave={handleSave} />
        ) : (
          <>
            {type === 'product' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={`${process.env.REACT_APP_API_URL}${item.ProductImages?.[0]?.url || '/placeholder.jpg'}`}
                  alt="preview"
                  style={{ width: '80px', height: '80px', objectFit: 'cover' }}
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
            {type === 'order' && `Заказ #${item.id} - Статус: ${item.status} - Сумма: ${item.total_price} ₽`}
            {type === 'user' && `${item.email} - ${item.role}`}
            <button onClick={() => handleEdit(type, item.id)}>
              {isEditing ? 'Отмена' : 'Редактировать'}
            </button>
            <button onClick={() => handleDelete(`/${type}s`, item.id)}>Удалить</button>
          </>
        )}
      </li>
    );
  };

  return (
    <div>
      <h1>Админ-панель</h1>

      <h2>Продукты</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
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
        <>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {products.map((product) =>
              renderItem('product', product, editProductId, ProductForm, { productId: product.id })
            )}
          </ul>
          <div>
            <button disabled={productPage === 1} onClick={() => setProductPage(productPage - 1)}>
              Назад
            </button>
            <span>Страница {productPage} из {productPagination.pages}</span>
            <button
              disabled={productPage === productPagination.pages}
              onClick={() => setProductPage(productPage + 1)}
            >
              Вперед
            </button>
          </div>
        </>
      )}

      <h2>Категории</h2>
      <CategoryForm onSave={handleSave} />
      {categories.length === 0 ? (
        <p>Категории отсутствуют</p>
      ) : (
        <>
          <ul>
            {categories.map((category) =>
              renderItem('category', category, editCategoryId, CategoryForm, { categoryId: category.id })
            )}
          </ul>
          <div>
            <button disabled={categoryPage === 1} onClick={() => setCategoryPage(categoryPage - 1)}>
              Назад
            </button>
            <span>Страница {categoryPage} из {categoryPagination.pages}</span>
            <button
              disabled={categoryPage === categoryPagination.pages}
              onClick={() => setCategoryPage(categoryPage + 1)}
            >
              Вперед
            </button>
          </div>
        </>
      )}

      <h2>Заказы</h2>
      <div>
        <label>Фильтр по статусу:</label>
        <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
          <option value="">Все</option>
          <option value="pending">В обработке</option>
          <option value="shipped">Отправлен</option>
          <option value="delivered">Доставлен</option>
          <option value="cancelled">Отменен</option>
        </select>
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
      <OrderForm onSave={handleSave} />
      {orders.length === 0 ? (
        <p>Заказы отсутствуют</p>
      ) : (
        <>
          <ul>
            {orders.map((order) =>
              renderItem('order', order, editOrderId, OrderForm, { orderId: order.id })
            )}
          </ul>
          <div>
            <button disabled={orderPage === 1} onClick={() => setOrderPage(orderPage - 1)}>
              Назад
            </button>
            <span>Страница {orderPage} из {orderPagination.pages}</span>
            <button disabled={orderPage === orderPagination.pages} onClick={() => setOrderPage(orderPage + 1)}>
              Вперед
            </button>
          </div>
        </>
      )}

      <h2>Пользователи</h2>
      <div>
        <label>Поиск по email:</label>
        <input
          type="text"
          value={userSearch || ''}
          onChange={(e) => setUserSearch(e.target.value)}
          placeholder="Введите email"
        />
      </div>
      <UserForm onSave={handleSave} />
      {users.length === 0 ? (
        <p>Пользователи отсутствуют</p>
      ) : (
        <>
          <ul>
            {users.map((user) =>
              renderItem('user', user, editUserId, UserForm, { userId: user.id })
            )}
          </ul>
          <div>
            <button disabled={userPage === 1} onClick={() => setUserPage(userPage - 1)}>
              Назад
            </button>
            <span>Страница {userPage} из {userPagination.pages}</span>
            <button disabled={userPage === userPagination.pages} onClick={() => setUserPage(userPage + 1)}>
              Вперед
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminPanel;