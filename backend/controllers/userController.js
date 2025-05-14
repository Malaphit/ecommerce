const { User, Address, Referral } = require('../models');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

exports.getUsers = async (req, res) => {
  try {
    const { email, page = 1, limit = 10 } = req.query;
    const where = {};
    if (email) {
      where.email = { [Op.iLike]: `%${email}%` };
      const users = await User.findAll({
        where,
        attributes: ['id', 'email'],
      });
      return res.json(users);
    }
    
    const offset = (page - 1) * limit;
    const { count, rows } = await User.findAndCountAll({
      where,
      include: [Address, { model: Referral, as: 'Inviter' }],
      limit,
      offset,
    });

    res.json({
      users: rows,
      total: count,
      page: parseInt(page),
      pages: Math.ceil(count / limit),
    });
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении пользователей' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const user = await User.findByPk(req.params.id, {
      include: [
        Address,
        { model: Referral, as: 'Inviter' },
        {
          model: Referral,
          as: 'Invited',
          include: [{ model: User, as: 'Invited' }],
          limit,
          offset,
        },
      ],
    });
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    const referralCount = await Referral.count({ where: { inviter_id: req.params.id } });
    res.json({
      user,
      referrals: {
        rows: user.Invited,
        total: referralCount,
        page: parseInt(page),
        pages: Math.ceil(referralCount / limit),
      },
    });
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении пользователя' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email и пароль обязательны' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Пароль должен быть минимум 6 символов' });
    }
    if (!['user', 'admin', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Недопустимая роль' });
    }
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password_hash: hashedPassword,
      first_name,
      last_name,
      phone,
      role,
      referral_code: Math.random().toString(36).substring(2, 10),
      bonus_points: 0,
    });
    const { password_hash: _, ...userData } = user.toJSON();
    res.status(201).json(userData);
  } catch (error) {
    console.error('Error in createUser:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании пользователя' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone, role } = req.body;
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: 'Пользователь с таким email уже существует' });
      }
    }
    if (!['user', 'admin', 'manager'].includes(role)) {
      return res.status(400).json({ message: 'Недопустимая роль' });
    }
    const updateData = { email, first_name, last_name, phone, role };
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: 'Пароль должен быть минимум 6 символов' });
      }
      updateData.password_hash = await bcrypt.hash(password, 10);
    }
    await user.update(updateData);
    const { password_hash: _, ...userData } = user.toJSON();
    res.json(userData);
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении пользователя' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    await user.destroy();
    res.json({ message: 'Пользователь удален' });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({ message: 'Ошибка сервера при удалении пользователя' });
  }
};