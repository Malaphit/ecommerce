const { User, Address, Referral } = require('../models');

exports.getUsers = async (req, res) => {
    try {
      const users = await User.findAll({ include: [Address, { model: Referral, as: 'Inviter' }] });
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
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
      res.status(500).json({ message: error.message });
    }
  };

  exports.updateUser = async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
  
      if (req.body.password) {
        if (req.body.password.length < 8) {
          return res.status(400).json({ message: 'Пароль должен содержать минимум 8 символов' });
        }
        req.body.password_hash = await bcrypt.hash(req.body.password, 10);
        delete req.body.password;
      }
  
      await user.update(req.body);
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });
    await user.destroy();
    res.json({ message: 'Пользователь удален' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};