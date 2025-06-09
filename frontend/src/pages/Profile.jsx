import { useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';

function Profile() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [addressForm, setAddressForm] = useState({
    city: '',
    street: '',
    house: '',
    building: '',
    apartment: '',
    postal_code: '',
  });
  const [referralCode, setReferralCode] = useState('');
  const [editAddressId, setEditAddressId] = useState(null);
  const [error, setError] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');
  const [orderPage, setOrderPage] = useState(1);
  const [referralPage, setReferralPage] = useState(1);
  const [orderPagination, setOrderPagination] = useState({ total: 0, pages: 1 });
  const [referralPagination, setReferralPagination] = useState({ total: 0, pages: 1 });
  const [activeSection, setActiveSection] = useState('personal');
  const limit = 10;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [userRes, orderRes, addressRes] = await Promise.all([
          api.get(`/users/${user.id}?page=${referralPage}&limit=${limit}`),
          api.get(`/orders?page=${orderPage}&limit=${limit}`),
          api.get('/addresses'),
        ]);
        console.log('Order API Response:', orderRes.data);
        setProfile(userRes.data.user);
        setOrders(orderRes.data.orders);
        setOrderPagination({
          total: orderRes.data.total,
          pages: orderRes.data.pages,
        });
        setAddresses(Array.isArray(addressRes.data) ? addressRes.data : []);
        setReferrals(userRes.data.referrals.rows);
        setReferralPagination({
          total: userRes.data.referrals.total,
          pages: userRes.data.referrals.pages,
        });
      } catch (err) {
        setError('Не удалось загрузить профиль');
        console.error('Ошибка загрузки профиля:', err);
      }
    };
    if (user) fetchProfile();
  }, [user, orderPage, referralPage]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${user.id}`, profile);
      alert('Профиль обновлен');
    } catch (err) {
      setError('Не удалось обновить профиль');
    }
  };

  const handlePasswordResetLink = async () => {
    try {
      const response = await api.post('/auth/forgot-password', { email: profile.email });
      setResetMessage(response.data.message || 'Ссылка для сброса отправлена');
      setResetError('');
    } catch (err) {
      setResetError(err.response?.data?.message || 'Ошибка при отправке ссылки');
      setResetMessage('');
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editAddressId) {
        await api.put(`/addresses/${editAddressId}`, addressForm);
      } else {
        await api.post('/addresses', addressForm);
      }
      const addressRes = await api.get('/addresses');
      setAddresses(Array.isArray(addressRes.data) ? addressRes.data : []);
      setAddressForm({ city: '', street: '', house: '', building: '', apartment: '', postal_code: '' });
      setEditAddressId(null);
    } catch (err) {
      setError('Не удалось сохранить адрес');
    }
  };

  const handleAddressEdit = (address) => {
    setAddressForm(address);
    setEditAddressId(address.id);
  };

  const handleAddressChange = (e) => {
    setAddressForm({ ...addressForm, [e.target.name]: e.target.value });
  };

  const handleAddressDelete = async (id) => {
    try {
      await api.delete(`/addresses/${id}`);
      const addressRes = await api.get('/addresses');
      setAddresses(Array.isArray(addressRes.data) ? addressRes.data : []);
    } catch (err) {
      setError('Не удалось удалить адрес');
    }
  };

  const handleReferralCodeSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/referrals/apply', { referral_code: referralCode });
      setReferralCode('');
      setProfile({ ...profile, bonus_points: response.data.bonus_points });
      alert('Реферальный код успешно применен');
    } catch (err) {
      setError(err.response?.data?.message || 'Не удалось применить реферальный код');
    }
  };

  const fillExampleAddress = () => {
    setAddressForm({
      city: 'Москва',
      street: 'Ленинский проспект',
      house: '15',
      building: '2',
      apartment: '25',
      postal_code: '119071',
    });
  };

  if (!profile) return <p className="profile">Загрузка...</p>;

  return (
    <div className="profile">
      <div className="profile-container">
        <div className="sidebar">
          <div
            className={`sidebar-item ${activeSection === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveSection('personal')}
          >
            Личная информация
          </div>
          <div
            className={`sidebar-item ${activeSection === 'referrals' ? 'active' : ''}`}
            onClick={() => setActiveSection('referrals')}
          >
            Реферальный код
          </div>
          <div
            className={`sidebar-item ${activeSection === 'addresses' ? 'active' : ''}`}
            onClick={() => setActiveSection('addresses')}
          >
            Адреса
          </div>
          <div
            className={`sidebar-item ${activeSection === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveSection('orders')}
          >
            История заказов
          </div>
        </div>
        <div className="profile-content">
          {error && <p className="error">{error}</p>}

          {activeSection === 'personal' && (
            <>
              <h2>Личная информация</h2>
              <form onSubmit={handleProfileUpdate}>
                <div>
                  <label>Email:</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  />
                </div>
                <div>
                  <label>Имя:</label>
                  <input
                    type="text"
                    value={profile.first_name || ''}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <label>Фамилия:</label>
                  <input
                    type="text"
                    value={profile.last_name || ''}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  />
                </div>
                <div>
                  <label>Телефон:</label>
                  <input
                    type="text"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label>Реферальный код:</label>
                  <input type="text" value={profile.referral_code} disabled />
                </div>
                <div>
                  <label>Бонусные баллы:</label>
                  <input type="text" value={profile.bonus_points} disabled />
                </div>
                <button type="submit">Обновить профиль</button>
              </form>

              <h2>Сброс пароля</h2>
              {resetMessage && <p className="success">{resetMessage}</p>}
              {resetError && <p className="error">{resetError}</p>}
              <button onClick={handlePasswordResetLink}>Сброс пароля</button>
            </>
          )}

          {activeSection === 'referrals' && (
            <>
              <h2>Применить реферальный код</h2>
              <form onSubmit={handleReferralCodeSubmit}>
                <div>
                  <label>Реферальный код:</label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Введите реферальный код"
                  />
                </div>
                <button type="submit">Применить</button>
              </form>

              <h2>Реферальная история</h2>
              {referrals.length === 0 ? (
                <p>Рефералы отсутствуют</p>
              ) : (
                <>
                  <ul>
                    {referrals.map((ref) => (
                      <li key={ref.id}>
                        <span>
                          Приглашенный пользователь: {ref.Invited?.email || 'Неизвестно'} - Бонус начислен:{' '}
                          {ref.bonus_awarded ? 'Да' : 'Нет'}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="pagination">
                    <button
                      disabled={referralPage === 1}
                      onClick={() => setReferralPage(referralPage - 1)}
                    >
                      Назад
                    </button>
                    <span>Страница {referralPage} из {referralPagination.pages}</span>
                    <button
                      disabled={referralPage === referralPagination.pages}
                      onClick={() => setReferralPage(referralPage + 1)}
                    >
                      Вперед
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {activeSection === 'addresses' && (
            <>
              <h2>Адреса</h2>
              <form onSubmit={handleAddressSubmit}>
                <div>
                  <label>Город:</label>
                  <input
                    type="text"
                    name="city"
                    value={addressForm.city}
                    onChange={handleAddressChange}
                    placeholder="Введите город"
                    required
                  />
                </div>
                <div>
                  <label>Улица:</label>
                  <input
                    type="text"
                    name="street"
                    value={addressForm.street}
                    onChange={handleAddressChange}
                    placeholder="Введите улицу"
                    required
                  />
                </div>
                <div>
                  <label>Дом:</label>
                  <input
                    type="text"
                    name="house"
                    value={addressForm.house}
                    onChange={handleAddressChange}
                    placeholder="Введите номер дома"
                    required
                  />
                </div>
                <div>
                  <label>Корпус:</label>
                  <input
                    type="text"
                    name="building"
                    value={addressForm.building}
                    onChange={handleAddressChange}
                    placeholder="Введите корпус (если есть)"
                  />
                </div>
                <div>
                  <label>Квартира:</label>
                  <input
                    type="text"
                    name="apartment"
                    value={addressForm.apartment}
                    onChange={handleAddressChange}
                    placeholder="Введите номер квартиры (если есть)"
                  />
                </div>
                <div>
                  <label>Почтовый индекс:</label>
                  <input
                    type="text"
                    name="postal_code"
                    value={addressForm.postal_code}
                    onChange={handleAddressChange}
                    placeholder="Введите почтовый индекс"
                  />
                </div>
                <button type="button" onClick={fillExampleAddress}>Заполнить пример</button>
                <button type="submit">{editAddressId ? 'Обновить адрес' : 'Добавить адрес'}</button>
              </form>
              <h3>Сохраненные адреса</h3>
              {addresses.length === 0 ? (
                <p>Адреса отсутствуют</p>
              ) : (
                <ul>
                  {addresses.map((addr) => (
                    <li key={addr.id}>
                      <span>
                        {addr.city}, {addr.street}, {addr.house}
                        {addr.building && `, корп. ${addr.building}`}
                        {addr.apartment && `, кв. ${addr.apartment}`}
                        {addr.postal_code && `, ${addr.postal_code}`}
                      </span>
                      <div>
                        <button onClick={() => handleAddressEdit(addr)}>Редактировать</button>
                        <button onClick={() => handleAddressDelete(addr.id)}>Удалить</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {activeSection === 'orders' && (
            <>
              <h2>История заказов</h2>
              {orders.length === 0 ? (
                <p>Заказы отсутствуют</p>
              ) : (
                <>
                  {orders.map((order) => (
                    <div key={order.id} className="order-card">
                      <p>Номер заказа: {order.id}</p>
                      <p>
                        Статус: {order.status === 'pending' ? 'В обработке' :
                          order.status === 'shipped' ? 'Отправлен' :
                          order.status === 'delivered' ? 'Доставлен' : 'Отменен'}
                      </p>
                      <p>Общая сумма: {(Number(order.total_price) || 0).toFixed(2)} ₽</p>
                      <p>
                        Адрес: {order.Address ? (
                          `${order.Address.city}, ${order.Address.street}, ${order.Address.house}` +
                          `${order.Address.building ? `, корп. ${order.Address.building}` : ''}` +
                          `${order.Address.apartment ? `, кв. ${order.Address.apartment}` : ''}` +
                          `${order.Address.postal_code ? `, ${order.Address.postal_code}` : ''}`
                        ) : 'Адрес не указан'}
                      </p>
                      <p>Трек-номер: {order.tracking_number || 'Не указан'}</p>
                      <h3>Товары:</h3>
                      <ul>
                        {order.OrderItems.map((item) => (
                          <li key={item.id}>
                            <span>
                              {item.Product?.name || 'Товар не найден'} (Размер: {item.size}, Кол-во: {item.quantity})
                            </span>
                            <span> - {(Number(item.price_at_time) || 0).toFixed(2)} ₽</span>
                            {item.Product?.ProductImages?.[0]?.url && (
                              <img
                                src={`${process.env.REACT_APP_API_URL}${item.Product.ProductImages[0].url}`}
                                alt={item.Product.name}
                                style={{ width: '50px', height: '50px', marginLeft: '10px' }}
                              />
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <div className="pagination">
                    <button
                      disabled={orderPage === 1}
                      onClick={() => setOrderPage(orderPage - 1)}
                    >
                      Назад
                    </button>
                    <span>Страница {orderPage} из {orderPagination.pages}</span>
                    <button
                      disabled={orderPage === orderPagination.pages}
                      onClick={() => setOrderPage(orderPage + 1)}
                    >
                      Вперед
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;