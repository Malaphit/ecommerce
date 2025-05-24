const { Order, OrderItem, Product, Category, sequelize, User } = require('../models');

exports.getCart = async (req, res) => {
  try {
    if (!req.user.cartOrderId) {
      return res.json([]);
    }
    const order = await Order.findByPk(req.user.cartOrderId, {
      include: [{ model: OrderItem, include: [{ model: Product, include: [{ model: Category }] }] }],
    });
    if (!order) {
      return res.json([]);
    }
    res.json(order.OrderItems);
  } catch (error) {
    console.error('Ошибка в getCart:', error);
    res.status(500).json({ message: `Ошибка загрузки корзины: ${error.message}` });
  }
};

exports.addToCart = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    console.log('addToCart: Пользователь:', req.user);
    if (!req.user || !req.user.id) {
      await t.rollback();
      return res.status(401).json({ message: 'Пользователь не авторизован или отсутствует ID' });
    }

    const { product_id, size, quantity } = req.body;
    console.log('addToCart: Входные данные:', { product_id, size, quantity });
    if (!product_id || !size || !quantity || quantity < 1) {
      await t.rollback();
      return res.status(400).json({ message: 'Неверные данные: укажите product_id, size и quantity' });
    }

    const product = await Product.findByPk(product_id, { include: [{ model: Category }], transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: 'Товар не найден' });
    }
    if (!product.available_sizes.includes(parseInt(size))) {
      await t.rollback();
      return res.status(400).json({ message: 'Недопустимый размер' });
    }

    let order;
    if (!req.user.cartOrderId) {
      order = await Order.create(
        {
          user_id: req.user.id,
          total_price: 0,
          status: 'pending',
          address_id: null,
        },
        { transaction: t }
      );
      await User.update({ cartOrderId: order.id }, { where: { id: req.user.id }, transaction: t });
    } else {
      order = await Order.findByPk(req.user.cartOrderId, { transaction: t });
      if (!order) {
        await t.rollback();
        return res.status(404).json({ message: 'Корзина не найдена' });
      }
    }

    let orderItem = await OrderItem.findOne({
      where: { order_id: order.id, product_id, size: size.toString() },
      transaction: t,
    });

    if (orderItem) {
      orderItem.quantity += quantity;
      await orderItem.save({ transaction: t });
    } else {
      orderItem = await OrderItem.create(
        {
          order_id: order.id,
          product_id,
          size: size.toString(),
          quantity,
          price_at_time: product.price,
        },
        { transaction: t }
      );
    }

    const total_price = await OrderItem.sum('price_at_time', {
      where: { order_id: order.id },
      transaction: t,
    });
    await order.update({ total_price: total_price || 0 }, { transaction: t });

    await t.commit();
    res.json(orderItem);
  } catch (error) {
    await t.rollback();
    console.error('Ошибка в addToCart:', error, error.stack);
    res.status(500).json({ message: `Ошибка добавления в корзину: ${error.message}` });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity < 1) {
      return res.status(400).json({ message: 'Количество должно быть не менее 1' });
    }
    const orderItem = await OrderItem.findByPk(req.params.id);
    if (!orderItem || orderItem.order_id !== req.user.cartOrderId) {
      return res.status(404).json({ message: 'Элемент корзины не найден' });
    }
    orderItem.quantity = quantity;
    await orderItem.save();

    const total_price = await OrderItem.sum('price_at_time', {
      where: { order_id: orderItem.order_id },
    });
    await Order.update({ total_price: total_price || 0 }, { where: { id: orderItem.order_id } });

    res.json(orderItem);
  } catch (error) {
    console.error('Ошибка в updateCartItem:', error);
    res.status(500).json({ message: `Ошибка обновления корзины: ${error.message}` });
  }
};

exports.deleteCartItem = async (req, res) => {
  try {
    const orderItem = await OrderItem.findByPk(req.params.id);
    if (!orderItem || orderItem.order_id !== req.user.cartOrderId) {
      return res.status(404).json({ message: 'Элемент корзины не найден' });
    }
    await orderItem.destroy();

    const total_price = await OrderItem.sum('price_at_time', {
      where: { order_id: orderItem.order_id },
    });
    await Order.update({ total_price: total_price || 0 }, { where: { id: orderItem.order_id } });

    res.json({ message: 'Элемент удален из корзины' });
  } catch (error) {
    console.error('Ошибка в deleteCartItem:', error);
    res.status(500).json({ message: `Ошибка удаления элемента: ${error.message}` });
  }
};