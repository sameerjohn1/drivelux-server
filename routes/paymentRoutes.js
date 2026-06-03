const express = require('express');
const router = express.Router();
const { initiatePayment, confirmPayment, getPaymentHistory, refundPayment } = require('../controllers/paymentController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.post('/initiate', initiatePayment);
router.put('/:id/confirm', confirmPayment);
router.get('/history', getPaymentHistory);
router.put('/:id/refund', authorize('admin'), refundPayment);

module.exports = router;
