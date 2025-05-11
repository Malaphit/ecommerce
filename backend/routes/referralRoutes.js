const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const referralController = require('../controllers/referralController');
const router = express.Router();

router.get('/', authenticate, authorize(['admin']), referralController.getReferrals);
router.post('/', authenticate, authorize(['admin', 'user']), referralController.createReferral);
router.put('/:id', authenticate, authorize(['admin']), referralController.updateReferral);
router.delete('/:id', authenticate, authorize(['admin']), referralController.deleteReferral);

module.exports = router;