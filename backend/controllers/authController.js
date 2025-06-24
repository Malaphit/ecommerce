const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendResetPasswordEmail } = require('../utils/email');
const crypto = require('crypto');

exports.register = async (req, res) => {
  const { email, password, first_name, last_name, phone } = req.body;
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const referral_code = crypto.randomBytes(8).toString('hex');
    const user = await User.create({
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      referral_code,
    });
    res.status(201).json({ message: 'Пользователь зарегистрирован', userId: user.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Неверные учетные данные' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, role: user.role });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    await user.update({ reset_token: resetToken });

    await sendResetPasswordEmail(email, resetToken);
    res.json({ message: 'Ссылка для сброса пароля отправлена на email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const user = await User.findOne({ where: { reset_token: token } });
    if (!user) return res.status(400).json({ message: 'Неверный или просроченный токен' });

    const password_hash = await bcrypt.hash(password, 10);
    await user.update({ password_hash, reset_token: null });
    res.json({ message: 'Пароль успешно сброшен' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
exports.getMe = async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      cartOrderId: req.user.cartOrderId,
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ message: 'Ошибка получения пользователя' });
  }
};