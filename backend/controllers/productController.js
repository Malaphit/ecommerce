const { Product, Category, ProductImage, Op } = require('../models');
const fs = require('fs');
const path = require('path');

exports.getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'created_at', order = 'DESC', search } = req.query;
    const offset = (page - 1) * limit;
    const where = search ? { name: { [Op.iLike]: `%${search}%` } } : {};

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [{ model: Category, attributes: ['id', 'name'] }, { model: ProductImage }],
      order: [[sort, order.toUpperCase()]],
      limit,
      offset,
    });

    res.json({
      products: rows,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
    });
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

exports.uploadProductImages = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Продукт не найден' });

    const files = req.files;
    if (!files || files.length === 0) return res.status(400).json({ message: 'Файлы не предоставлены' });
    if (files.length > 10) return res.status(400).json({ message: 'Максимум 10 изображений' });

    const images = [];
    for (const file of files) {
      const image = await ProductImage.create({
        product_id: product.id,
        url: `/uploads/${file.filename}`,
      });
      images.push(image);
    }

    res.status(201).json(images);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [Category, ProductImage],
    });
    if (!product) return res.status(404).json({ message: 'Продукт не найден' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
