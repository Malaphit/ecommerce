const sequelize = require('../config/database');
const { DataTypes, Sequelize } = require('sequelize');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  first_name: { type: DataTypes.STRING(100) },
  last_name: { type: DataTypes.STRING(100) },
  phone: {
    type: DataTypes.STRING(20),
    validate: { is: /^[0-9+\-() ]+$/ },
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'manager'),
    allowNull: false,
    defaultValue: 'user',
  },
  referral_code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  referred_by: { type: DataTypes.INTEGER },
  bonus_points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: { min: 0 },
  },
  reset_token: { type: DataTypes.STRING(255) },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ fields: ['email'] }, { fields: ['referral_code'] }],
  defaultValue: Sequelize.NOW,
});

const Address = sequelize.define('Address', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  city: { type: DataTypes.STRING(100), allowNull: false, validate: { notEmpty: true } },
  street: { type: DataTypes.STRING(100), allowNull: false, validate: { notEmpty: true } },
  house: { type: DataTypes.STRING(20), allowNull: false, validate: { notEmpty: true } },
  building: { type: DataTypes.STRING(20) },
  apartment: { type: DataTypes.STRING(20) },
  postal_code: { type: DataTypes.STRING(20) },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ fields: ['user_id'] }],
});

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true, validate: { notEmpty: true } },
  description: { type: DataTypes.TEXT },
  weight: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ fields: ['name'] }],
});

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  category_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { notEmpty: true } },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
  available_sizes: { type: DataTypes.JSONB, allowNull: false },
  views_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ fields: ['category_id'] }, { fields: ['is_active'] }],
});

const ProductImage = sequelize.define('ProductImage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  url: { type: DataTypes.STRING, allowNull: false },
  product_id: {type: DataTypes.INTEGER,allowNull: false,references: { model: 'Products', key: 'id', } },
  position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});


const Order = sequelize.define('Order', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  total_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
  status: {
    type: DataTypes.ENUM('pending', 'shipped', 'delivered', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
  },
  tracking_number: { type: DataTypes.STRING(50) },
  address_id: { type: DataTypes.INTEGER, allowNull: false },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ fields: ['user_id'] }, { fields: ['status'] }],
});

const OrderItem = sequelize.define('OrderItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  size: { type: DataTypes.STRING(10), allowNull: false, validate: { notEmpty: true } },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1 } },
  price_at_time: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
}, {
  timestamps: false,
  indexes: [{ fields: ['order_id'] }, { fields: ['product_id'] }],
});

const OrderStatusHistory = sequelize.define('OrderStatusHistory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'shipped', 'delivered', 'cancelled'),
    allowNull: false,
  },
  changed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.NOW },
}, {
  timestamps: false,
  indexes: [{ fields: ['order_id'] }],
});

const Payment = sequelize.define('Payment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
  payment_method: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'sberbank' },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
  },
  transaction_id: { type: DataTypes.STRING(50) },
  bonus_points_used: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [{ fields: ['order_id'] }],
});

const Referral = sequelize.define('Referral', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  inviter_id: { type: DataTypes.INTEGER, allowNull: false },
  invited_id: { type: DataTypes.INTEGER, allowNull: false },
  bonus_awarded: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [{ fields: ['inviter_id'] }, { fields: ['invited_id'] }],
});

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  type: {
    type: DataTypes.ENUM('email', 'sms', 'push'),
    allowNull: false,
    defaultValue: 'email',
  },
  message: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: true } },
  is_sent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [{ fields: ['user_id'] }],
});

const ChatMessage = sequelize.define('ChatMessage', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER },
  admin_id: { type: DataTypes.INTEGER },
  message: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: true } },
  is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  sender_role: {
    type: DataTypes.ENUM('user', 'admin', 'manager'),
    allowNull: false,
    defaultValue: 'user',
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [{ fields: ['user_id'] }, { fields: ['admin_id'] }, { fields: ['created_at'] }],
});

// Associations
User.hasMany(Address, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Address.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Order, { foreignKey: 'user_id', onDelete: 'RESTRICT' });
Order.belongsTo(User, { foreignKey: 'user_id' });

Order.belongsTo(Address, { foreignKey: 'address_id', onDelete: 'RESTRICT' });

Category.hasMany(Product, { foreignKey: 'category_id', onDelete: 'RESTRICT' });
Product.belongsTo(Category, { foreignKey: 'category_id' });

Product.hasMany(ProductImage, { foreignKey: 'product_id', onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

OrderItem.belongsTo(Product, { foreignKey: 'product_id', onDelete: 'RESTRICT' });

Order.hasMany(OrderStatusHistory, { foreignKey: 'order_id', onDelete: 'CASCADE' });
OrderStatusHistory.belongsTo(Order, { foreignKey: 'order_id' });

Order.hasMany(Payment, { foreignKey: 'order_id', onDelete: 'RESTRICT' });
Payment.belongsTo(Order, { foreignKey: 'order_id' });

User.hasMany(Referral, { as: 'Inviter', foreignKey: 'inviter_id', onDelete: 'RESTRICT' });
User.hasMany(Referral, { as: 'Invited', foreignKey: 'invited_id', onDelete: 'RESTRICT' });
Referral.belongsTo(User, { as: 'Inviter', foreignKey: 'inviter_id' });
Referral.belongsTo(User, { as: 'Invited', foreignKey: 'invited_id' });

User.hasMany(Notification, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(ChatMessage, { as: 'UserMessages', foreignKey: 'user_id', onDelete: 'SET NULL' });
User.hasMany(ChatMessage, { as: 'AdminMessages', foreignKey: 'admin_id', onDelete: 'SET NULL' });
ChatMessage.belongsTo(User, { as: 'User', foreignKey: 'user_id' });
ChatMessage.belongsTo(User, { as: 'Admin', foreignKey: 'admin_id' });

sequelize.sync({ force: false }).then(() => {
    console.log('Database synced');
  });  

module.exports = {
  sequelize,
  User,
  Address,
  Category,
  Product,
  ProductImage,
  Order,
  OrderItem,
  OrderStatusHistory,
  Payment,
  Referral,
  Notification,
  ChatMessage,
};