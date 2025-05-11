const { Product, Category, Op } = require('../models');

exports.getProducts = async (req, res) => {
  try {
    const { category, price_min, price_max, search } = req.query;
    const where = {};
    if (category) where.category_id = category;
    if (price_min) where.price = { [Op.gte]: price_min };
    if (price_max) where.price = { ...where.price, [Op.lte]: price_max };
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    const products = await Product.findAll({
      where,
      include: [Category],
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await product.update(req.body);
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};