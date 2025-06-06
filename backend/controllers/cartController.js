const { Order, OrderItem, Product, Category, sequelize, User, ProductImage } = require('../models');

exports.getCart = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Пользователь не авторизован' });
    }

    if (!req.user.cartOrderId) {
      return res.json([]);
    }

    const order = await Order.findOne({
      where: {
        id: req.user.cartOrderId,
        user_id: req.user.id,
        status: 'pending',
      },
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              include: [
                { model: Category, attributes: ['id', 'name', 'weight'] },
                { model: ProductImage, attributes: ['url'], required: false },
              ],
            },
          ],
          required: false,
        },
      ],
    });

    if (!order || !order.OrderItems) {
      return res.json([]);
    }

    const cartItems = order.OrderItems.map(item => ({
      id: item.id,
      order_id: item.order_id,
      product_id: item.product_id,
      size: item.size,
      quantity: item.quantity,
      price_at_time: Number(item.price_at_time) || 0,
      Product: item.Product
        ? {
            ...item.Product.get({ plain: true }),
            ProductImages: item.Product.ProductImages || [],
          }
        : null,
    }));

    res.json(cartItems);
  } catch (error) {
    console.error('Ошибка в getCart:', error, error.stack);
    res.status(500).json({ message: `Ошибка загрузки корзины: ${error.message}` });
  }
};

exports.addToCart = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    if (!req.user || !req.user.id) {
      await t.rollback();
      return res.status(401).json({ message: 'Пользователь не авторизован или отсутствует ID' });
    }

    const { product_id, size, quantity } = req.body;
    if (!product_id || !size || !quantity || quantity < 1) {
      await t.rollback();
      return res.status(400).json({ message: 'Неверные данные: укажите product_id, size и quantity' });
    }

    const product = await Product.findByPk(product_id, {
      include: [
        { model: Category, attributes: ['id', 'name', 'weight'] },
        { model: ProductImage, attributes: ['url'], required: false },
      ],
      transaction: t,
    });
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
      if (!order || order.user_id !== req.user.id || order.status !== 'pending') {
        await t.rollback();
        return res.status(404).json({ message: 'Корзина не найдена или недоступна' });
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
    }) * 1;
    await order.update({ total_price: total_price || 0 }, { transaction: t });

    const responseItem = {
      id: orderItem.id,
      order_id: orderItem.order_id,
      product_id: orderItem.product_id,
      size: orderItem.size,
      quantity: orderItem.quantity,
      price_at_time: Number(orderItem.price_at_time) || 0,
      Product: product
        ? {
            ...product.get({ plain: true }),
            ProductImages: product.ProductImages || [],
          }
        : null,
    };

    await t.commit();
    res.json(responseItem);
  } catch (error) {
    await t.rollback();
    console.error('Ошибка в addToCart:', error, error.stack);
    res.status(500).json({ message: `Ошибка добавления в корзину: ${error.message}` });
  }
};

exports.updateCartItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { quantity } = req.body;
    if (quantity < 1) {
      await t.rollback();
      return res.status(400).json({ message: 'Количество должно быть не менее 1' });
    }
    const orderItem = await OrderItem.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          include: [
            { model: Category, attributes: ['id', 'name', 'weight'] },
            { model: ProductImage, attributes: ['url'], required: false },
          ],
        },
      ],
      transaction: t,
    });
    if (!orderItem || orderItem.order_id !== req.user.cartOrderId) {
      await t.rollback();
      return res.status(404).json({ message: 'Элемент корзины не найден' });
    }
    orderItem.quantity = quantity;
    await orderItem.save({ transaction: t });

    const total_price = await OrderItem.sum('price_at_time', {
      where: { order_id: orderItem.order_id },
      transaction: t,
    }) * 1;
    await Order.update({ total_price: total_price || 0 }, { where: { id: orderItem.order_id }, transaction: t });

    const responseItem = {
      id: orderItem.id,
      order_id: orderItem.order_id,
      product_id: orderItem.product_id,
      size: orderItem.size,
      quantity: orderItem.quantity,
      price_at_time: Number(orderItem.price_at_time) || 0,
      Product: orderItem.Product
        ? {
            ...orderItem.Product.get({ plain: true }),
            ProductImages: orderItem.Product.ProductImages || [],
          }
        : null,
    };

    await t.commit();
    res.json(responseItem);
  } catch (error) {
    await t.rollback();
    console.error('Ошибка в updateCartItem:', error, error.stack);
    res.status(500).json({ message: `Ошибка обновления корзины: ${error.message}` });
  }
};

exports.deleteCartItem = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const orderItem = await OrderItem.findByPk(req.params.id, { transaction: t });
    if (!orderItem || orderItem.order_id !== req.user.cartOrderId) {
      await t.rollback();
      return res.status(404).json({ message: 'Элемент корзины не найден' });
    }
    await orderItem.destroy({ transaction: t });

    const total_price = await OrderItem.sum('price_at_time', {
      where: { order_id: orderItem.order_id },
      transaction: t,
    }) * 1;
    await Order.update({ total_price: total_price || 0 }, { where: { id: orderItem.order_id }, transaction: t });

    await t.commit();
    res.json({ message: 'Элемент удален из корзины' });
  } catch (error) {
    await t.rollback();
    console.error('Ошибка в deleteCartItem:', error, error.stack);
    res.status(500).json({ message: `Ошибка удаления элемента: ${error.message}` });
  }
};