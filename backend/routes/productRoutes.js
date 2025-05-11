const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const productController = require('../controllers/productController');
const router = express.Router();

router.get('/', productController.getProducts);
router.post('/', authenticate, authorize(['admin']), productController.createProduct);
router.put('/:id', authenticate, authorize(['admin']), productController.updateProduct);
router.delete('/:id', authenticate, authorize(['admin']), productController.deleteProduct);

module.exports = router;