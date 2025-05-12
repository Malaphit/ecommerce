const { Address } = require('../models');

exports.getAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({ where: { user_id: req.user.id } });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAddress = async (req, res) => {
  try {
    const address = await Address.create({ ...req.body, user_id: req.user.id });
    res.status(201).json(address);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const address = await Address.findByPk(req.params.id);
    if (!address || address.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Адрес не найден' });
    }
    await address.update(req.body);
    res.json(address);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const address = await Address.findByPk(req.params.id);
    if (!address || address.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Адрес не найден' });
    }
    await address.destroy();
    res.json({ message: 'Адрес удален' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};