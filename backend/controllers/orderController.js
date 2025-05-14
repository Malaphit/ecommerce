const { Order, User, Address, OrderItem, Product, Op } = require('../models');

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sort = 'created_at', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;
    const where = status ? { status } : {};

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [{ model: User, attributes: ['id', 'email'] }, { model: Address }],
      order: [[sort, order]],
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

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['id', 'email'] },
        { model: Address, attributes: ['id', 'city', 'street', 'house'] },
      ],
    });
    if (!order) return res.status(404).json({ message: 'Заказ не найден' });
    res.json(order);
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
    if (!order) return res.status(404).json({ message: 'Заказ не найден' });
    await order.update(req.body);
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Заказ не найден' });
    await order.destroy();
    res.json({ message: 'Заказ удалён' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};