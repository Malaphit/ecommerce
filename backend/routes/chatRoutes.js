const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const chatController = require('../controllers/chatController');
const router = express.Router();

router.get('/', authenticate, authorize(['manager']), chatController.getChats);

module.exports = router;