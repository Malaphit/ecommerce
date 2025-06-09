const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.error('Authenticate: No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Authenticate: Декодированный токен:', decoded);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Пользователь не найден' });
    }

    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      cartOrderId: user.cartOrderId, 
    };

    next();
  } catch (error) {
    console.error('Authenticate error:', error.message, { token, errorStack: error.stack });
    res.status(401).json({ message: 'Invalid token' });
  }
};

const authorize = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    console.error('Authorize: Access denied', { userRole: req.user.role, requiredRoles: roles });
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

module.exports = { authenticate, authorize };
