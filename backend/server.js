const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path'); // <== добавили
const sequelize = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const referralRoutes = require('./routes/referralRoutes');
const chatRoutes = require('./routes/chatRoutes');
const addressRoutes = require('./routes/addressRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/payments', paymentRoutes);

sequelize.authenticate()
  .then(() => {
    console.log('Подключение к базе данных успешно');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));
  })
  .catch((err) => {
    console.error('Не удалось подключиться к базе данных:', err);
  });
