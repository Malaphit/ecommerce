const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');
const router = express.Router();

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', authenticate, authorize(['admin']), categoryController.createCategory);
router.put('/:id', authenticate, authorize(['admin']), categoryController.updateCategory);
router.delete('/:id', authenticate, authorize(['admin']), categoryController.deleteCategory);

module.exports = router;