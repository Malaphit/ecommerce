const { Order, User, Address, OrderItem, Product, Op } = require('../models');

exports.getOrders = async (req, res) => {
    try {
      const { status, user_id, page = 1, limit = 10 } = req.query;
      const where = {};
      if (status) where.status = status;
      if (user_id) where.user_id = user_id;
  
      const offset = (page - 1) * limit;
      const { count, rows } = await Order.findAndCountAll({
        where,
        include: [User, Address, { model: OrderItem, include: [Product] }],
        limit,
        offset,
      });
  
      res.json({
        orders: rows,
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit),
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

exports.createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await order.update(req.body);
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    await order.destroy();
    res.json({ message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};