const express = require('express');
const { authenticate } = require('../middleware/auth');
const cartController = require('../controllers/cartController');
const router = express.Router();

router.get('/', authenticate, cartController.getCart);
router.post('/', authenticate, cartController.addToCart);
router.put('/:id', authenticate, cartController.updateCartItem);
router.delete('/:id', authenticate, cartController.deleteCartItem);

module.exports = router;