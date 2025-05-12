const { Payment } = require('../models');
const { processPayment } = require('../services/sberpay');

exports.createPayment = async (req, res) => {
  try {
    const { order_id, amount } = req.body;
    const order = { total_price: amount };
    const paymentResult = await processPayment(order);
    const payment = await Payment.create({
      order_id,
      amount,
      payment_method: 'sberpay',
      status: paymentResult.status,
      transaction_id: paymentResult.transactionId,
    });
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message }); 
  }
};

exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.findAll();
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};