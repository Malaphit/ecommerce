const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');
const router = express.Router();

router.get('/', authenticate, authorize(['admin']), userController.getUsers);
router.get('/:id', authenticate, authorize(['admin','user']), userController.getUserById);
router.post('/', authenticate, authorize(['admin']), userController.createUser);
router.put('/:id', authenticate, authorize(['admin','user']), userController.updateUser);
router.delete('/:id', authenticate, authorize(['admin']), userController.deleteUser);

module.exports = router;