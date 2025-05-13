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
    if (!product) {
      console.log('Продукт не найден');
      return res.status(404).json({ message: 'Продукт не найден' });
    }

    const files = req.files;
    if (!files || files.length === 0) {
      console.log('Файлы не предоставлены');
      return res.status(400).json({ message: 'Файлы не предоставлены' });
    }

    console.log('Файлы:', files);

    const currentImages = await ProductImage.findAll({ where: { product_id: product.id } });
    if (currentImages.length + files.length > 10) {
      console.log('Превышен лимит изображений');
      return res.status(400).json({ message: 'Максимум 10 изображений' });
    }

    const images = [];
    for (const file of files) {
      console.log(`Сохраняем файл: ${file.filename}`);
      const image = await ProductImage.create({
        product_id: product.id,
        url: `/uploads/${file.filename}`,
      });
      images.push(image);
    }

    res.status(201).json(images);
  } catch (error) {
    console.error('Ошибка при загрузке изображений:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: ProductImage },
      ],
    });
    if (!product) return res.status(404).json({ message: 'Продукт не найден' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProductImage = async (req, res) => {
  try {
    const { productId, imageId } = req.params;
    const image = await ProductImage.findOne({
      where: { id: imageId, product_id: productId },
    });
    if (!image) return res.status(404).json({ message: 'Изображение не найдено' });

    const filePath = path.join(__dirname, '..', 'uploads', path.basename(image.url));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } else {
      console.warn(`File not found: ${filePath}`);
    }

    await image.destroy();
    res.json({ message: 'Изображение удалено' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};