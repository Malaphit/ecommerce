const { Order, User, Address, OrderItem, Product, Category,ProductImage, OrderStatusHistory, sequelize } = require('../models');

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
        {
          model: User,
          attributes: ['id', 'email', 'first_name', 'last_name'],
          required: false,
        },
        {
          model: Address,
          attributes: ['id', 'city', 'street', 'house', 'building', 'apartment', 'postal_code'],
          required: false,
        },
        {
          model: OrderItem,
          required: false,
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'price', 'available_sizes', 'category_id'],
              required: false,
              include: [
                {
                  model: Category,
                  attributes: ['id', 'name', 'weight'],
                  required: false,
                },
                {
                  model: ProductImage,
                  attributes: ['url'],
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
      Address: order.Address || null,
      OrderItems: order.OrderItems.map(item => ({
        ...item.get({ plain: true }),
        price_at_time: Number(item.price_at_time) || 0,
        Product: item.Product
          ? {
              ...item.Product.get({ plain: true }),
              ProductImages: item.Product.ProductImages || [],
            }
          : null,
      })),
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
        {
          model: User,
          attributes: ['id', 'email', 'first_name', 'last_name'],
          required: false,
        },
        {
          model: Address,
          attributes: ['id', 'city', 'street', 'house', 'building', 'apartment', 'postal_code'],
          required: false,
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ['id', 'name', 'price', 'available_sizes', 'category_id'],
              include: [
                {
                  model: Category,
                  attributes: ['id', 'name', 'weight'],
                  required: false,
                },
                {
                  model: ProductImage,
                  attributes: ['url'],
                  required: false,
                },
              ],
              required: false,
            },
          ],
          required: false,
        },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    const formattedOrder = {
      ...order.get({ plain: true }),
      total_price: Number(order.total_price) || 0,
      Address: order.Address ? { ...order.Address.get({ plain: true }) } : null,
      OrderItems: Array.isArray(order.OrderItems)
        ? order.OrderItems.map(item => ({
            ...item.get({ plain: true }),
            price_at_time: Number(item.price_at_time) || 0,
            Product: item.Product
              ? {
                  ...item.Product.get({ plain: true }),
                  name: item.Product.name || 'Товар не найден',
                  price: Number(item.Product.price) || 0,
                  available_sizes: Array.isArray(item.Product.available_sizes) ? item.Product.available_sizes : [],
                  category_id: item.Product.category_id || null,
                  Category: item.Product.Category ? { ...item.Product.Category.get({ plain: true }) } : null,
                  ProductImages: Array.isArray(item.Product.ProductImages) ? item.Product.ProductImages : [],
                }
              : null,
          }))
        : [],
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error('Ошибка в getOrderById:', {
      message: error.message,
      stack: error.stack,
      orderId: req.params.id,
    });
    res.status(500).json({ message: `Ошибка загрузки заказа: ${error.message}` });
  }
};

exports.createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { address_id } = req.body;

    if (!req.user || !req.user.id) {
      await t.rollback();
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    const user = await User.findByPk(req.user.id, { transaction: t });
    if (!user) {
      await t.rollback();
      return res.status(404).json({ message: `Пользователь не найден` });
    }

    const order = await Order.findByPk(user.cartOrderId, {
      include: [OrderItem],
      transaction: t,
    });

    if (!order || order.status !== 'pending') {
      await t.rollback();
      return res.status(400).json({ message: 'Корзина пуста или недействительна' });
    }

    if (!address_id || isNaN(address_id)) {
      await t.rollback();
      return res.status(400).json({ message: 'Некорректный или отсутствующий address_id' });
    }

    const address = await Address.findByPk(address_id, { transaction: t });
    if (!address) {
      await t.rollback();
      return res.status(404).json({ message: 'Адрес не найден' });
    }

    if (!order.OrderItems || order.OrderItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Корзина пуста' });
    }

    let total_price = 0;
    for (const item of order.OrderItems) {
      total_price += Number(item.price_at_time) * item.quantity;
    }

    await order.update(
      {
        address_id,
        total_price,
        status: 'pending',
      },
      { transaction: t }
    );

    await OrderStatusHistory.create(
      {
        order_id: order.id,
        status: 'pending',
        changed_at: new Date(),
      },
      { transaction: t }
    );

    await user.update({ cartOrderId: null }, { transaction: t });

    await user.update({ cartOrderId: null }, { transaction: t });

    const newCartOrder = await Order.create({
      user_id: user.id,
      status: 'pending',
      total_price: 0,
      address_id: null,
    }, { transaction: t });

    await user.update({ cartOrderId: newCartOrder.id }, { transaction: t });

    await t.commit();
    res.status(201).json({
      message: 'Заказ успешно создан',
      order_id: order.id,
      new_cart_order_id: newCartOrder.id,
    });
  } catch (error) {
    await t.rollback();
    console.error('Ошибка в createOrder:', {
      message: error.message,
      stack: error.stack,
      input: req.body,
    });
    res.status(500).json({ message: `Ошибка создания заказа: ${error.message}` });
  }
};

exports.updateOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    if (!req.body || typeof req.body !== 'object') {
      await t.rollback();
      return res.status(400).json({ message: 'Некорректный JSON в запросе' });
    }

    const { status, address_id } = req.body;
    console.log('updateOrder input:', { order_id: req.params.id, status, address_id });

    if (!req.params.id || isNaN(req.params.id)) {
      await t.rollback();
      return res.status(400).json({ message: 'Некорректный ID заказа' });
    }

    const order = await Order.findByPk(req.params.id, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    const updates = {};
    if (status && ['pending', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      updates.status = status;
    }
    if (address_id !== undefined) {
      if (address_id && !isNaN(address_id)) {
        const address = await Address.findByPk(address_id, { transaction: t });
        if (!address) {
          await t.rollback();
          return res.status(404).json({ message: `Адрес с ID ${address_id} не найден` });
        }
        updates.address_id = address_id;
      } else {
        updates.address_id = null;
      }
    }

    if (Object.keys(updates).length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Не указаны данные для обновления' });
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
    res.json({ message: 'Заказ успешно обновлен', order: order.get({ plain: true }) });
  } catch (error) {
    await t.rollback();
    console.error('Ошибка в updateOrder:', {
      message: error.message,
      stack: error.stack,
      orderId: req.params.id,
      input: req.body,
    });
    res.status(500).json({ message: `Ошибка обновления заказа: ${error.message}` });
  }
};

exports.deleteOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    if (!req.params.id || isNaN(req.params.id)) {
      await t.rollback();
      return res.status(400).json({ message: 'Некорректный ID заказа' });
    }

    console.log('deleteOrder input:', { order_id: req.params.id });

    const order = await Order.findByPk(req.params.id, { transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Заказ не найден' });
    }

    await sequelize.models.Payment.destroy({
      where: { order_id: order.id },
      transaction: t,
    });

    await order.destroy({ transaction: t });

    await t.commit();
    res.json({ message: 'Заказ успешно удален' });
  } catch (error) {
    await t.rollback();
    console.error('Ошибка в deleteOrder:', {
      message: error.message,
      stack: error.stack,
      orderId: req.params.id,
    });
    res.status(500).json({ message: `Ошибка удаления заказа: ${error.message}` });
  }
};