const { Order, User, Address, OrderItem, Product, Category } = require('../models'); 

exports.getOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sort = 'created_at', order = 'DESC' } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (req.user.role === 'user') {
      where.user_id = req.user.id;
    }
    if (status && status !== '') {
      where.status = status;
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['id', 'email', 'first_name', 'last_name'], required: false },
        { model: Address, required: false },
        {
          model: OrderItem,
          required: false,
          include: [
            {
              model: Product,
              required: false,
              include: [
                {
                  model: Category,
                  attributes: ['id', 'name', 'weight'],
                  required: false,
                },
              ],
            },
          ],
        },
      ],
      order: [[sort, order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const orders = rows.map(order => ({
      ...order.get({ plain: true }),
      total_price: Number(order.total_price) || 0, 
    }));

    res.json({
      orders,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('Ошибка в getOrders:', error, error.stack);
    res.status(500).json({ message: `Ошибка загрузки заказов: ${error.message}` });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['id', 'email', 'first_name', 'last_name'] },
        { model: Address },
        { model: OrderItem, include: [{ model: Product, include: [{ model: Category }] }] },
      ],
    });
    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: `Ошибка загрузки заказа: ${error.message}` });
  }
};

exports.createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { user_id, address_id, items } = req.body;
    if (req.user.role === 'user' && user_id !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ message: 'Недостаточно прав' });
    }
    const user = await User.findByPk(user_id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: 'Пользователь не найден' });
    }
    const address = await Address.findByPk(address_id, { transaction: t });
    if (!address) {
      await t.rollback();
      return res.status(404).json({ message: 'Адрес не найден' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Не указаны товары' });
    }

    const order = await Order.create(
      {
        user_id,
        address_id,
        total_price: 0,
        status: 'pending',
      },
      { transaction: t }
    );

    let total_price = 0;
    for (const item of items) {
      const product = await Product.findByPk(item.product_id, { include: [{ model: Category }], transaction: t });
      if (!product) {
        await t.rollback();
        return res.status(404).json({ message: `Товар ${item.product_id} не найден` });
      }
      if (!product.available_sizes.includes(parseInt(item.size))) {
        await t.rollback();
        return res.status(400).json({ message: `Недопустимый размер для товара ${item.product_id}` });
      }
      if (item.quantity < 1) {
        await t.rollback();
        return res.status(400).json({ message: 'Количество должно быть не менее 1' });
      }
      const price_at_time = product.price;
      total_price += price_at_time * item.quantity;
      await OrderItem.create(
        {
          order_id: order.id,
          product_id: item.product_id,
          size: item.size,
          quantity: item.quantity,
          price_at_time,
        },
        { transaction: t }
      );
    }

    await order.update({ total_price }, { transaction: t });
    await OrderStatusHistory.create(
      {
        order_id: order.id,
        status: 'pending',
        changed_at: new Date(),
      },
      { transaction: t }
    );

    await t.commit();
    res.status(201).json({ message: 'Заказ создан', order_id: order.id });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: `Ошибка создания заказа: ${error.message}` });
  }
};

exports.updateOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { status, address_id } = req.body;
    const order = await Order.findByPk(req.params.id, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Заказ не найден' });
    }
    const updates = {};
    if (status && ['pending', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      updates.status = status;
    }
    if (address_id) {
      const address = await Address.findByPk(address_id, { transaction: t });
      if (!address) {
        await t.rollback();
        return res.status(404).json({ message: 'Адрес не найден' });
      }
      updates.address_id = address_id;
    }
    await order.update(updates, { transaction: t });
    if (status) {
      await OrderStatusHistory.create(
        {
          order_id: order.id,
          status,
          changed_at: new Date(),
        },
        { transaction: t }
      );
    }
    await t.commit();
    res.json({ message: 'Заказ обновлен', order });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: `Ошибка обновления заказа: ${error.message}` });
  }
};

exports.deleteOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Заказ не найден' });
    }
    await order.destroy({ transaction: t });
    await t.commit();
    res.json({ message: 'Заказ удален' });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: `Ошибка удаления заказа: ${error.message}` });
  }
};