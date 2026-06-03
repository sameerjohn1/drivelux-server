const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    name: { type: String, required: [true, 'Car name is required'], trim: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    category: { type: String, enum: ['economy', 'standard', 'premium', 'luxury', 'suv', 'van', 'sports'], required: true },
    fuelType: { type: String, enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng'], required: true },
    transmission: { type: String, enum: ['automatic', 'manual'], required: true },
    seats: { type: Number, required: true, min: 2, max: 15 },
    doors: { type: Number, default: 4 },
    pricePerDay: { type: Number, required: true },
    pricePerHour: { type: Number },
    description: { type: String, maxlength: 1000 },
    images: [{ url: String, publicId: String }],
    features: [String],
    location: {
      city: { type: String, required: true },
      state: String,
      country: { type: String, default: 'Pakistan' },
      coordinates: { lat: Number, lng: Number },
    },
    isAvailable: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    mileage: String,
    color: String,
    plateNumber: { type: String },
    registrationNumber: String,
    insuranceExpiry: Date,
    unavailableDates: [{ from: Date, to: Date }],
  },
  { timestamps: true }
);

carSchema.index({ location: 1, isAvailable: 1, pricePerDay: 1 });
carSchema.index({ brand: 1, category: 1, fuelType: 1 });

module.exports = mongoose.model('Car', carSchema);
