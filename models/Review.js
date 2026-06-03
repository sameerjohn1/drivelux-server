const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, maxlength: 100 },
    comment: { type: String, required: true, maxlength: 1000 },
    images: [{ url: String, publicId: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

reviewSchema.index({ car: 1, user: 1 }, { unique: true });

reviewSchema.post('save', async function () {
  await this.constructor.calcAverageRating(this.car);
});

reviewSchema.post('remove', async function () {
  await this.constructor.calcAverageRating(this.car);
});

reviewSchema.statics.calcAverageRating = async function (carId) {
  const stats = await this.aggregate([
    { $match: { car: carId } },
    { $group: { _id: '$car', avgRating: { $avg: '$rating' }, nRatings: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await mongoose.model('Car').findByIdAndUpdate(carId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      totalRatings: stats[0].nRatings,
    });
  }
};

module.exports = mongoose.model('Review', reviewSchema);
