const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize(['admin', 'user', 'manager']), orderController.getOrders);
router.get('/:id', authenticate, authorize(['admin', 'manager']), orderController.getOrderById);
router.post('/', authenticate, authorize(['admin', 'user', 'manager']), orderController.createOrder);
router.put('/:id', authenticate, authorize(['admin', 'manager']), orderController.updateOrder);
router.delete('/:id', authenticate, authorize(['admin', 'manager']), orderController.deleteOrder);

module.exports = router;