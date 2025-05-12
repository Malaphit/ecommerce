const express = require('express');
const { authenticate } = require('../middleware/auth');
const addressController = require('../controllers/addressController');
const router = express.Router();

router.get('/', authenticate, addressController.getAddresses);
router.post('/', authenticate, addressController.createAddress);
router.put('/:id', authenticate, addressController.updateAddress);
router.delete('/:id', authenticate, addressController.deleteAddress);

module.exports = router;