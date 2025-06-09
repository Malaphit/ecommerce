import { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import CartItem from '../components/CartItem';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Cart() {
  const { user } = useContext(AuthContext);
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [deliveryCost, setDeliveryCost] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }

    const fetchCart = async () => {
      try {
        const res = await api.get('/cart');
        setCartItems(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Ошибка загрузки корзины:', error);
        toast.error(error.response?.data?.message || 'Ошибка загрузки корзины');
      }
    };

    const fetchAddresses = async () => {
      try {
        const res = await api.get('/addresses');
        setAddresses(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Ошибка загрузки адресов');
      }
    };

    fetchCart();
    fetchAddresses();
  }, [user, navigate, location.pathname]);

  const calculateDelivery = async () => {
    if (!selectedAddress) {
      toast.error('Выберите адрес доставки');
      return;
    }
    try {
      const res = await api.post('/checkout/calculate-delivery', {
        address_id: selectedAddress,
        tariff_code: '136',
      });
      setDeliveryCost(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Ошибка расчета доставки');
    }
  };

  const updateCart = async (id, quantity) => {
    try {
      const res = await api.put(`/cart/${id}`, { quantity });
      setCartItems(cartItems.map((item) => (item.id === id ? res.data : item)));
      toast.success('Количество обновлено');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Ошибка обновления корзины');
    }
  };

  const removeFromCart = async (id) => {
    try {
      console.log('Отправляем запрос DELETE /cart/' + id);
      await api.delete(`/cart/${id}`);
      setCartItems(cartItems.filter((item) => item.id !== id));
      toast.success('Товар удален из корзины');
    } catch (error) {
      console.error('Ошибка удаления товара:', error.response?.data || error.message);
      toast.error(error.response?.data?.message || 'Ошибка удаления товара');
    }
  };
  

  const handleCheckout = () => {
    if (!selectedAddress) {
      toast.error('Выберите адрес доставки');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Корзина пуста');
      return;
    }
    setIsPaymentModalOpen(true);
  };

  const confirmPayment = async (isPaid) => {
    setIsPaymentModalOpen(false);
    try {
      const res = await api.post('/checkout/checkout', {
        address_id: selectedAddress,
        tariff_code: '136',
        payment_method: isPaid ? 'sberbank' : 'none',
      });
      toast.success('Заказ успешно создан');
      setCartItems([]);
      setDeliveryCost(null);
      navigate('/profile/orders');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Ошибка оформления заказа');
    }
  };

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.quantity * (Number(item.price_at_time) || 0),
    0
  );

  return (
    <div className="cart-container">
      <h1>Корзина</h1>
      {cartItems.length === 0 ? (
        <p>Ваша корзина пуста</p>
      ) : (
        <>
          {cartItems.map((item) => (
            <CartItem
              key={`${item.id}-${item.size}`}
              item={{
                id: item.id,
                size: item.size,
                quantity: item.quantity,
                price: Number(item.price_at_time) || 0,
                name: item.Product?.name || 'Без названия',
                image: item.Product?.ProductImages?.[0]?.url,
              }}
              updateCart={updateCart}
              removeFromCart={removeFromCart}
            />
          ))}

          <div className="cart-summary">
            <p>Итого без доставки: {totalPrice.toFixed(2)} ₽</p>
            {deliveryCost && (
              <p>
                Стоимость доставки: {deliveryCost.delivery_cost.toFixed(2)} ₽ (
                Ориентировочно: {deliveryCost.estimated_days.min}–
                {deliveryCost.estimated_days.max} дней)
              </p>
            )}
            <p>Общая сумма: {(totalPrice + (deliveryCost?.delivery_cost || 0)).toFixed(2)} ₽</p>
          </div>

          <div className="address-selector">
            <label>Выберите адрес:</label>
            <select value={selectedAddress} onChange={(e) => setSelectedAddress(Number(e.target.value))}>
              <option value="">Выберите адрес</option>
              {addresses.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.city}, {addr.street}, {addr.house}
                  {addr.building ? `, корп. ${addr.building}` : ''}
                  {addr.apartment ? `, кв. ${addr.apartment}` : ''}
                </option>
              ))}
            </select>
            <button onClick={calculateDelivery}>Рассчитать доставку</button>
          </div>

          <button
            onClick={handleCheckout}
            disabled={!selectedAddress || cartItems.length === 0}
          >
            Оформить заказ
          </button>
        </>
      )}

      {isPaymentModalOpen && (
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <h2>Подтверждение оплаты</h2>
            <p>Общая сумма: {(totalPrice + (deliveryCost?.delivery_cost || 0)).toFixed(2)} ₽</p>
            <p>Подтвердите, что оплата выполнена:</p>
            <div className="payment-buttons">
              <button onClick={() => confirmPayment(true)}>Оплатили</button>
              <button onClick={() => confirmPayment(false)}>Не оплатили</button>
              <button onClick={() => setIsPaymentModalOpen(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;