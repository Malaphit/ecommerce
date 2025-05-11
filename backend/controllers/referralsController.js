const { Referral, User } = require('../models');

exports.getReferrals = async (req, res) => {
  try {
    const referrals = await Referral.findAll({ include: [{ model: User, as: 'Inviter' }, { model: User, as: 'Invited' }] });
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
    if (!referral) return res.status(404).json({ message: 'Referral not found' });
    await referral.update(req.body);
    res.json(referral);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteReferral = async (req, res) => {
  try {
    const referral = await Referral.findByPk(req.params.id);
    if (!referral) return res.status(404).json({ message: 'Referral not found' });
    await referral.destroy();
    res.json({ message: 'Referral deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};