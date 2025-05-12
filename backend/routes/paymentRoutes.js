const express = require('express');
const { authenticate } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');
const router = express.Router();

router.get('/', authenticate, paymentController.getPayments);
router.post('/', authenticate, paymentController.createPayment);

module.exports = router;