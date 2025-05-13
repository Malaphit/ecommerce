const { Category } = require('../models');

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Категория не найдена' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description, weight } = req.body;
    if (!name) return res.status(400).json({ message: 'Название обязательно' });
    const category = await Category.create({ name, description, weight: weight || 0 });
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Категория не найдена' });
    const { name, description, weight } = req.body;
    if (!name) return res.status(400).json({ message: 'Название обязательно' });
    await category.update({ name, description, weight: weight || 0 });
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Категория не найдена' });
    await category.destroy();
    res.json({ message: 'Категория удалена' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};