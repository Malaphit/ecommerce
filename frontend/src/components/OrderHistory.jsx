import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get(`/orders?page=${page}&limit=10`);
        setOrders(res.data.orders);
        setTotalPages(res.data.pages);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Ошибка загрузки заказов');
      }
    };
    fetchOrders();
  }, [page]);

  return (
    <div className="order-history-container">
      <h2>Ваши заказы</h2>
      {orders.length === 0 ? (
        <p>Заказы отсутствуют</p>
      ) : (
        <>
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <p>Номер заказа: {order.id}</p>
              <p>
                Статус: {order.status === 'pending' ? 'В обработке' : order.status === 'shipped' ? 'Отправлен' : order.status === 'delivered' ? 'Доставлен' : 'Отменен'}
              </p>
              <p>Общая сумма: ${order.total_price.toFixed(2)}</p>
              <p>
                Адрес: {order.Address?.city}, {order.Address?.street}, {order.Address?.house}
                {order.Address?.building ? `, корп. ${order.Address.building}` : ''}
                {order.Address?.apartment ? `, кв. ${order.Address.apartment}` : ''}
              </p>
              <p>Трек-номер: {order.tracking_number || 'Не указан'}</p>
              <h3>Товары:</h3>
              <ul>
                {order.OrderItems.map((item) => (
                  <li key={item.id}>
                    {item.Product.name} - Размер: {item.size} - Кол-во: {item.quantity} - ${item.price_at_time.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="pagination">
            <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
              Предыдущая
            </button>
            <span>Страница {page} из {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
              Следующая
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default OrderHistory;