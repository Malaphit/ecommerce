const express = require('express');
const { authenticate } = require('../middleware/auth');
const checkoutController = require('../controllers/checkoutController');
const router = express.Router();

router.post('/calculate-delivery', authenticate, checkoutController.calculateDelivery);
router.post('/checkout', authenticate, checkoutController.checkout);

module.exports = router;