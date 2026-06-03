const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    pickupLocation: { address: String, city: String, coordinates: { lat: Number, lng: Number } },
    dropoffLocation: { address: String, city: String, coordinates: { lat: Number, lng: Number } },
    totalDays: { type: Number, required: true },
    pricePerDay: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'approved', 'active', 'completed', 'cancelled'], default: 'pending' },
    paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
    paymentMethod: { type: String, enum: ['stripe', 'jazzcash', 'easypaisa', 'cash'], default: 'cash' },
    paymentId: String,
    cancellationReason: String,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: Date,
    notes: String,
    isReviewed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
