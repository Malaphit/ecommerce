const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.register = async (req, res) => {
  const { email, password, first_name, last_name, phone } = req.body;
  try {
    const password_hash = await bcrypt.hash(password, 10);
    const referral_code = Math.random().toString(36).substring(2, 15);
    const user = await User.create({
      email,
      password_hash,
      first_name,
      last_name,
      phone,
      referral_code
    });
    res.status(201).json({ message: 'User registered', userId: user.id });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    // Заглушка для реализации сброса пароля
    res.json({ message: 'Password reset link sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};