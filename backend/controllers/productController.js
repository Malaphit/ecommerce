const { Product, Category, ProductImage } = require('../models');
const { Op } = require('sequelize'); 

const fs = require('fs');
const path = require('path');

exports.getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'created_at',
      order = 'DESC',
      search,
      category_id,
      is_active,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) where.name = { [Op.iLike]: `%${search}%` };
    if (category_id) where.category_id = category_id;
    if (is_active !== undefined && is_active !== '') {
      where.is_active = is_active === 'true';
    }

    const allowedSortFields = ['id', 'name', 'price', 'created_at'];
    const safeSort = allowedSortFields.includes(sort) ? sort : 'created_at';

    const safeOrder = order && order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: ProductImage },
      ],
      order: [[safeSort, safeOrder]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      products: rows,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('Ошибка в getProducts:', error.message, error.stack);
    res.status(500).json({ message: `Ошибка загрузки товаров: ${error.message}` });
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

    const currentImages = await ProductImage.findAll({ where: { product_id: product.id } });
    if (currentImages.length + files.length > 10) {
      return res.status(400).json({ message: 'Максимум 10 изображений' });
    }

    const images = [];
    for (const file of files) {
      const image = await ProductImage.create({
        product_id: product.id,
        url: `/Uploads/${file.filename}`,
        position: currentImages.length + images.length,
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
      include: [
        { model: Category, attributes: ['id', 'name'] },
        { model: ProductImage, order: [['position', 'ASC']] },
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

    const filePath = path.join(__dirname, '..', 'Uploads', path.basename(image.url));
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.warn(`File not found or error deleting: ${filePath}`);
    }

    await image.destroy();
    res.json({ message: 'Изображение удалено' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateImagePositions = async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { positions } = req.body;
    if (!positions || !Array.isArray(positions)) {
      return res.status(400).json({ message: 'Неверный формат данных позиций' });
    }

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ message: 'Продукт не найден' });

    for (const { id, position } of positions) {
      const image = await ProductImage.findOne({ where: { id, product_id: productId } });
      if (image) {
        await image.update({ position });
      }
    }

    res.json({ message: 'Позиции обновлены' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.cleanupUnusedImages = async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '..', 'Uploads');
    const files = fs.readdirSync(uploadDir);
    const imageUrls = await ProductImage.findAll({ attributes: ['url'] });
    const usedFilenames = imageUrls.map((img) => path.basename(img.url));

    let deletedCount = 0;
    for (const file of files) {
      if (!usedFilenames.includes(file)) {
        const filePath = path.join(uploadDir, file);
        try {
          fs.unlinkSync(filePath);
          deletedCount++;
        } catch (fileError) {
          console.warn(`File not found or error deleting: ${filePath}`);
        }
      }
    }

    res.json({ message: `Удалено ${deletedCount} неиспользуемых файлов` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};