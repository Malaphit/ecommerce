const { OrderItem, Product } = require('../models');

exports.getCart = async (req, res) => {
  try {
    const cartItems = await OrderItem.findAll({
      where: { order_id: req.user.cartOrderId }, 
      include: [Product],
    });
    res.json(cartItems);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { product_id, size, quantity } = req.body;
    const product = await Product.findByPk(product_id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const orderItem = await OrderItem.create({
      order_id: req.user.cartOrderId,
      product_id,
      size,
      quantity,
      price_at_time: product.price,
    });
    res.status(201).json(orderItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const cartItem = await OrderItem.findByPk(req.params.id);
    if (!cartItem) return res.status(404).json({ message: 'Cart item not found' });
    await cartItem.update(req.body);
    res.json(cartItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCartItem = async (req, res) => {
  try {
    const cartItem = await OrderItem.findByPk(req.params.id);
    if (!cartItem) return res.status(404).json({ message: 'Cart item not found' });
    await cartItem.destroy();
    res.json({ message: 'Cart item deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};