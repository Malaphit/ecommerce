const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const orderController = require('../controllers/orderController');
const router = express.Router();

router.get('/', authenticate, authorize(['admin', 'user']), orderController.getOrders);
router.post('/', authenticate, authorize(['user']), orderController.createOrder);
router.put('/:id', authenticate, authorize(['admin']), orderController.updateOrder);
router.delete('/:id', authenticate, authorize(['admin']), orderController.deleteOrder);

module.exports = router;