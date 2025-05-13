import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import ProductForm from '../components/ProductForm';
import CategoryForm from '../components/CategoryForm';
import OrderForm from '../components/OrderForm';
import UserForm from '../components/UserForm';
// import ReferralForm from '../components/ReferralForm';

function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  // const [referrals, setReferrals] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [userPagination, setUserPagination] = useState({ total: 0, pages: 1 });
  const [orderPagination, setOrderPagination] = useState({ total: 0, pages: 1 });
  const [editProductId, setEditProductId] = useState(null);
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [editOrderId, setEditOrderId] = useState(null);
  const [editUserId, setEditUserId] = useState(null);
  const limit = 10;

  const fetchData = useCallback(async () => {
    try {
      const [prodRes, catRes, ordRes, userRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories'),
        api.get(`/orders?status=${orderStatusFilter}&page=${orderPage}&limit=${limit}`),
        api.get(`/users?email=${userSearch}&page=${userPage}&limit=${limit}`),
        // api.get('/referrals'),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      setOrders(ordRes.data.orders || ordRes.data);
      setOrderPagination({ total: ordRes.data.total, pages: ordRes.data.pages });
      setUsers(userRes.data.users || userRes.data);
      setUserPagination({ total: userRes.data.total, pages: userRes.data.pages });
      // setReferrals(refRes.data);
    } catch (error) {
      alert('Ошибка загрузки данных: ' + (error.response?.data?.message || 'Ошибка сервера'));
    }
  }, [orderStatusFilter, orderPage, userSearch, userPage]);

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
      <li key={item.id}>
        {isEditing ? (
          <FormComponent {...formProps} onSave={handleSave} />
        ) : (
          <>
            {type === 'product' && `${item.name} - ${item.price} ₽ (Категория: ${item.Category?.name || 'Без категории'})`}
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
      <ProductForm onSave={handleSave} />
      {products.length === 0 ? (
        <p>Продукты отсутствуют</p>
      ) : (
        <ul>
          {products.map((product) =>
            renderItem('product', product, editProductId, ProductForm, { productId: product.id })
          )}
        </ul>
      )}

      <h2>Категории</h2>
      <CategoryForm onSave={handleSave} />
      {categories.length === 0 ? (
        <p>Категории отсутствуют</p>
      ) : (
        <ul>
          {categories.map((category) =>
            renderItem('category', category, editCategoryId, CategoryForm, { categoryId: category.id })
          )}
        </ul>
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
          value={userSearch}
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

      {/* <h2>Рефералы</h2>
      <ReferralForm onSave={fetchData} />
      <ul>
        {referrals.map((referral) => (
          <li key={referral.id}>
            Пригласивший: {referral.Inviter?.email} - Приглашенный: {referral.Invited?.email}
            <button onClick={() => handleDelete('/referrals', referral.id)}>Удалить</button>
            <ReferralForm referralId={referral.id} onSave={fetchData} />
          </li>
        ))}
      </ul> */}
    </div>
  );
}

export default AdminPanel;