const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'PKR' },
    method: { type: String, enum: ['stripe', 'jazzcash', 'easypaisa', 'cash'], required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    transactionId: String,
    gatewayResponse: { type: mongoose.Schema.Types.Mixed },
    refundAmount: Number,
    refundedAt: Date,
    refundReason: String,
    receipt: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
