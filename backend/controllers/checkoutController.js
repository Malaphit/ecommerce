const {
  Order,
  OrderItem,
  Address,
  Product,
  Payment,
  sequelize,
  Category,
  OrderStatusHistory,
} = require('../models');
const dotenv = require('dotenv');
const sdekService = require('../services/sdek');

dotenv.config();

exports.calculateDelivery = async (req, res) => {
  try {
    const { address_id, tariff_code = '136' } = req.body;

    console.log('🛒 calculateDelivery вызван от пользователя:', {
      userId: req.user?.id,
      cartOrderId: req.user?.cartOrderId,
    });
    console.log('🔍 req.body:', req.body);

    if (!req.user?.id || !req.user.cartOrderId) {
      return res.status(401).json({ message: 'Пользователь не авторизован или корзина пуста' });
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
          include: [{ model: Product, include: [{ model: Category, attributes: ['id', 'name', 'weight'] }], required: true }],
          required: true,
        },
      ],
    });

    if (!order || !order.OrderItems.length) {
      return res.status(400).json({ message: 'В корзине нет товаров' });
    }

    const address = await Address.findByPk(address_id);
    if (!address) {
      return res.status(404).json({ message: 'Адрес не найден' });
    }

    const invalidItems = order.OrderItems.filter(
      (item) => !item.Product?.Category?.weight || item.Product.Category.weight <= 0
    );
    if (invalidItems.length > 0) {
      return res.status(400).json({
        message: 'Некоторые товары не имеют корректного веса в категории',
        invalidItems: invalidItems.map((item) => ({
          product_id: item.product_id,
          name: item.Product?.name || 'Неизвестный товар',
        })),
      });
    }

    const packages = order.OrderItems.map((item) => ({
      weight: item.Product.Category.weight * item.quantity,
      length: 30,
      width: 20,
      height: 10,
      items: [
        {
          ware_key: item.product_id.toString(),
          payment: 0,
          cost: Number(item.price_at_time) || 0,
          amount: item.quantity,
        },
      ],
    }));

    const { delivery_sum, period_min, period_max } = await sdekService.calculateDelivery({
      address,
      tariff_code,
      packages,
    });

    return res.json({
      delivery_cost: Number(delivery_sum) || 0,
      estimated_days: { min: period_min, max: period_max },
      tariff_code,
    });
  } catch (error) {
    console.error('Ошибка в calculateDelivery:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Ошибка расчета доставки' });
  }
};

exports.checkout = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { address_id, tariff_code = '136', payment_method = 'sberbank' } = req.body;

    console.log('🛍️ checkout вызван от пользователя:', {
      userId: req.user?.id,
      cartOrderId: req.user?.cartOrderId,
    });
    console.log('🔍 req.body:', req.body);

    if (!req.user?.id || !req.user.cartOrderId) {
      await t.rollback();
      return res.status(401).json({ message: 'Пользователь не авторизован или корзина пуста' });
    }

    const address = await Address.findByPk(address_id, { transaction: t });
    if (!address) {
      await t.rollback();
      return res.status(404).json({ message: 'Адрес не найден' });
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
          include: [{ model: Product, include: [{ model: Category, attributes: ['id', 'name', 'weight'] }], required: true }],
          required: true,
        },
      ],
      transaction: t,
    });

    if (!order || !order.OrderItems.length) {
      await t.rollback();
      return res.status(400).json({ message: 'Корзина пуста или заказ не найден' });
    }

    const invalidItems = order.OrderItems.filter(
      (item) => !item.Product?.Category?.weight || item.Product.Category.weight <= 0
    );
    if (invalidItems.length > 0) {
      await t.rollback();
      return res.status(400).json({
        message: 'Некоторые товары не имеют корректного веса в категории',
        invalidItems: invalidItems.map((item) => ({
          product_id: item.product_id,
          name: item.Product?.name || 'Неизвестный товар',
        })),
      });
    }

    const packages = order.OrderItems.map((item) => ({
      weight: item.Product.Category.weight * item.quantity,
      length: 30,
      width: 20,
      height: 10,
      items: [
        {
          ware_key: item.product_id.toString(),
          payment: 0,
          cost: Number(item.price_at_time) || 0,
          amount: item.quantity,
        },
      ],
    }));

    const { delivery_sum } = await sdekService.calculateDelivery({
      address,
      tariff_code,
      packages,
    });
    const delivery_cost = Number(delivery_sum) || 0;

    const tracking_number = `TRK-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    await order.update(
      {
        address_id,
        total_price: order.total_price + delivery_cost,
        status: 'confirmed',
        tracking_number,
      },
      { transaction: t }
    );

    await Payment.create(
      {
        order_id: order.id,
        amount: order.total_price + delivery_cost,
        payment_method,
        status: payment_method === 'sberbank' ? 'completed' : 'failed',
        transaction_id: `TX_${Date.now()}`,
        bonus_points_used: 0,
      },
      { transaction: t }
    );

    await OrderStatusHistory.create(
      {
        order_id: order.id,
        status: 'confirmed',
        changed_at: new Date(),
      },
      { transaction: t }
    );

    await req.user.update({ cartOrderId: null }, { transaction: t });

    await t.commit();
    res.json({
      message: 'Заказ успешно создан',
      order_id: order.id,
      tracking_number,
    });
  } catch (error) {
    await t.rollback();
    console.error('Ошибка в checkout:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Ошибка создания заказа' });
  }
};