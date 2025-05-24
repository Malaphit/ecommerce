const axios = require('axios');
const { Order, OrderItem, Address, Payment, sequelize } = require('../models');

const CDEK_API_URL = 'https://api.cdek.ru/v2';
const CDEK_ACCOUNT = process.env.CDEK_ACCOUNT;
const CDEK_SECURE_PASSWORD = process.env.CDEK_SECURE_PASSWORD;

exports.calculateDelivery = async (req, res) => {
  try {
    const { address_id, tariff_code = '136' } = req.body;
    if (!req.user.cartOrderId) {
      return res.status(400).json({ message: 'Корзина пуста' });
    }
    const address = await Address.findByPk(address_id);
    if (!address) {
      return res.status(404).json({ message: 'Адрес не найден' });
    }

    const orderItems = await OrderItem.findAll({
      where: { order_id: req.user.cartOrderId },
      include: [{ model: Product, include: [{ model: Category }] }],
    });
    if (orderItems.length === 0) {
      return res.status(400).json({ message: 'Корзина пуста' });
    }

    const packages = orderItems.map((item) => ({
      weight: item.Product.Category.weight * item.quantity,
      length: 30,
      width: 20,
      height: 10,
      items: [{ ware_key: item.product_id, payment: 0, cost: item.price_at_time, amount: item.quantity }],
    }));

    const response = await axios.post(
      `${CDEK_API_URL}/calculator/tariff`,
      {
        tariff_code,
        from_location: { postal_code: '101000' },
        to_location: { postal_code: address.postal_code || '101000' },
        packages,
      },
      {
        auth: { username: CDEK_ACCOUNT, password: CDEK_SECURE_PASSWORD },
      }
    );

    const { delivery_sum, period_min, period_max } = response.data;
    res.json({
      delivery_cost: delivery_sum,
      estimated_days: { min: period_min, max: period_max },
      tariff_code,
    });
  } catch (error) {
    res.status(500).json({ message: error.response?.data?.message || 'Ошибка расчета доставки' });
  }
};

exports.checkout = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { address_id, tariff_code = '136', payment_method = 'sberbank' } = req.body;
    if (!req.user.cartOrderId) {
      await t.rollback();
      return res.status(400).json({ message: 'Корзина пуста' });
    }
    const address = await Address.findByPk(address_id);
    if (!address) {
      await t.rollback();
      return res.status(404).json({ message: 'Адрес не найден' });
    }

    const order = await Order.findByPk(req.user.cartOrderId, {
      include: [{ model: OrderItem, include: [{ model: Product, include: [{ model: Category }] }] }],
      transaction: t,
    });
    if (!order || order.OrderItems.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: 'Корзина пуста' });
    }

    const packages = order.OrderItems.map((item) => ({
      weight: item.Product.Category.weight * item.quantity,
      length: 30,
      width: 20,
      height: 10,
      items: [{ ware_key: item.product_id, payment: 0, cost: item.price_at_time, amount: item.quantity }],
    }));

    const deliveryResponse = await axios.post(
      `${CDEK_API_URL}/calculator/tariff`,
      {
        tariff_code,
        from_location: { postal_code: '101000' },
        to_location: { postal_code: address.postal_code || '101000' },
        packages,
      },
      {
        auth: { username: CDEK_ACCOUNT, password: CDEK_SECURE_PASSWORD },
      }
    );

    const delivery_cost = deliveryResponse.data.delivery_sum;

    const cdekOrderResponse = await axios.post(
      `${CDEK_API_URL}/orders`,
      {
        tariff_code,
        sender: { name: 'Ваш магазин' },
        recipient: {
          name: `${req.user.first_name} ${req.user.last_name}`,
          phones: [{ number: req.user.phone }],
          email: req.user.email,
        },
        from_location: { postal_code: '101000' },
        to_location: {
          postal_code: address.postal_code,
          city: address.city,
          address: `${address.street}, ${address.house}${address.building ? `, корп. ${address.building}` : ''}${address.apartment ? `, кв. ${address.apartment}` : ''}`,
        },
        packages,
      },
      {
        auth: { username: CDEK_ACCOUNT, password: CDEK_SECURE_PASSWORD },
      }
    );

    const tracking_number = cdekOrderResponse.data.entity.uuid;

    await order.update(
      {
        address_id,
        total_price: order.total_price + delivery_cost,
        status: 'pending',
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
        status: 'pending',
        changed_at: new Date(),
      },
      { transaction: t }
    );

    await req.user.update({ cartOrderId: null }, { transaction: t });

    await t.commit();
    res.json({ message: 'Заказ успешно создан', order_id: order.id, tracking_number });
  } catch (error) {
    await t.rollback();
    res.status(500).json({ message: error.response?.data?.message || 'Ошибка создания заказа' });
  }
};