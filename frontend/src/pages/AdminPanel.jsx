import { useState, useEffect } from 'react';
import api from '../services/api';
import ProductForm from '../components/ProductForm';
import CategoryForm from '../components/CategoryForm';
import OrderForm from '../components/OrderForm';
import UserForm from '../components/UserForm';
import ReferralForm from '../components/ReferralForm';

function AdminPanel() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [referrals, setReferrals] = useState([]);

  const fetchData = async () => {
    const [prodRes, catRes, ordRes, userRes, refRes] = await Promise.all([
      api.get('/products'),
      api.get('/categories'),
      api.get('/orders'),
      api.get('/users'),
      api.get('/referrals'),
    ]);
    setProducts(prodRes.data);
    setCategories(catRes.data);
    setOrders(ordRes.data);
    setUsers(userRes.data);
    setReferrals(refRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (endpoint, id) => {
    try {
      await api.delete(`${endpoint}/${id}`);
      fetchData();
    } catch (error) {
      alert('Error deleting item');
    }
  };

  return (
    <div>
      <h1>Admin Panel</h1>

      <h2>Products</h2>
      <ProductForm onSave={fetchData} />
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            {product.name} - ${product.price}
            <button onClick={() => handleDelete('/products', product.id)}>Delete</button>
            <ProductForm productId={product.id} onSave={fetchData} />
          </li>
        ))}
      </ul>

      <h2>Categories</h2>
      <CategoryForm onSave={fetchData} />
      <ul>
        {categories.map((category) => (
          <li key={category.id}>
            {category.name}
            <button onClick={() => handleDelete('/categories', category.id)}>Delete</button>
            <CategoryForm categoryId={category.id} onSave={fetchData} />
          </li>
        ))}
      </ul>

      <h2>Orders</h2>
     -snip-
      <OrderForm onSave={fetchData} />
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            Order #{order.id} - Status: {order.status}
            <button onClick={() => handleDelete('/orders', order.id)}>Delete</button>
            <OrderForm orderId={order.id} onSave={fetchData} />
          </li>
        ))}
      </ul>

      <h2>Users</h2>
      <UserForm onSave={fetchData} />
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.email} - {user.role}
            <button onClick={() => handleDelete('/users', user.id)}>Delete</button>
            <UserForm userId={user.id} onSave={fetchData} />
          </li>
        ))}
      </ul>

      <h2>Referrals</h2>
      <ReferralForm onSave={fetchData} />
      <ul>
        {referrals.map((referral) => (
          <li key={referral.id}>
            Inviter: {referral.Inviter?.email} - Invited: {referral.Invited?.email}
            <button onClick={() => handleDelete('/referrals', referral.id)}>Delete</button>
            <ReferralForm referralId={referral.id} onSave={fetchData} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminPanel;