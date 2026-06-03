const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    licenseNumber: { type: String, required: true },
    licenseExpiry: { type: Date, required: true },
    experience: { type: Number, default: 0 },
    bio: { type: String, maxlength: 500 },
    isVerified: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    documents: [{ name: String, url: String, publicId: String }],
    availability: [
      {
        day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
        startTime: String,
        endTime: String,
      },
    ],
    bankDetails: {
      accountNumber: String,
      bankName: String,
      accountHolder: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Driver', driverSchema);
