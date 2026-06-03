const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

exports.initiatePayment = asyncHandler(async (req, res) => {
  const { bookingId, method } = req.body;
  const booking = await Booking.findById(bookingId);
  if (!booking) { res.status(404); throw new Error('Booking not found'); }
  if (booking.user.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }

  const payment = await Payment.create({
    booking: bookingId, user: req.user._id,
    amount: booking.totalAmount, method,
    transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    status: 'pending',
  });

  res.status(201).json({ success: true, data: payment, message: 'Payment initiated (mock)' });
});

exports.confirmPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) { res.status(404); throw new Error('Payment not found'); }

  payment.status = 'completed';
  payment.gatewayResponse = { mock: true, confirmedAt: new Date() };
  await payment.save();

  await Booking.findByIdAndUpdate(payment.booking, { paymentStatus: 'paid', paymentId: payment.transactionId });
  res.json({ success: true, data: payment });
});

exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id }).populate('booking', 'totalAmount startDate endDate car').sort('-createdAt');
  res.json({ success: true, data: payments });
});

exports.refundPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) { res.status(404); throw new Error('Payment not found'); }
  if (payment.status !== 'completed') { res.status(400); throw new Error('Payment cannot be refunded'); }

  payment.status = 'refunded';
  payment.refundAmount = payment.amount;
  payment.refundedAt = new Date();
  payment.refundReason = req.body.reason;
  await payment.save();
  await Booking.findByIdAndUpdate(payment.booking, { paymentStatus: 'refunded' });
  res.json({ success: true, data: payment });
});
