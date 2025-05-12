const { Referral, User } = require('../models');

exports.getReferrals = async (req, res) => {
  try {
    const referrals = await Referral.findAll({
      include: [{ model: User, as: 'Inviter' }, { model: User, as: 'Invited' }],
    });
    res.json(referrals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createReferral = async (req, res) => {
  try {
    const referral = await Referral.create(req.body);
    res.status(201).json(referral);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateReferral = async (req, res) => {
  try {
    const referral = await Referral.findByPk(req.params.id);
    if (!referral) return res.status(404).json({ message: 'Реферал не найден' });
    await referral.update(req.body);
    res.json(referral);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteReferral = async (req, res) => {
  try {
    const referral = await Referral.findByPk(req.params.id);
    if (!referral) return res.status(404).json({ message: 'Реферал не найден' });
    await referral.destroy();
    res.json({ message: 'Реферал удален' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.applyReferralCode = async (req, res) => {
  const { referral_code } = req.body;
  const userId = req.user.id;
  try {
    const inviter = await User.findOne({ where: { referral_code } });
    if (!inviter) return res.status(404).json({ message: 'Реферальный код не найден' });
    if (inviter.id === userId) return res.status(400).json({ message: 'Нельзя использовать собственный код' });

    const user = await User.findByPk(userId);
    if (user.referred_by) return res.status(400).json({ message: 'Реферальный код уже использован' });

    await Referral.create({
      inviter_id: inviter.id,
      invited_id: userId,
      bonus_awarded: true,
    });

    await user.update({ referred_by: inviter.id, bonus_points: user.bonus_points + 1000 });
    await inviter.update({ bonus_points: inviter.bonus_points + 1000 });

    res.json({ message: 'Реферальный код успешно применен', bonus_points: user.bonus_points + 1000 });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};