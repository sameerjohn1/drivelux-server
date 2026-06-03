const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Booking = require('../models/Booking');
const APIFeatures = require('../utils/apiFeatures');

exports.getReviews = asyncHandler(async (req, res) => {
  const filter = req.params.carId ? { car: req.params.carId } : {};
  const features = new APIFeatures(Review.find(filter).populate('user', 'name avatar'), req.query).sort().paginate();
  const reviews = await features.query;
  const total = await Review.countDocuments(filter);
  res.json({ success: true, count: reviews.length, total, data: reviews });
});

exports.createReview = asyncHandler(async (req, res) => {
  const { carId, bookingId, rating, title, comment } = req.body;
  const booking = await Booking.findOne({ _id: bookingId, user: req.user._id, status: 'completed' });
  if (!booking) { res.status(400); throw new Error('You can only review completed bookings'); }
  if (booking.isReviewed) { res.status(400); throw new Error('You already reviewed this booking'); }

  const review = await Review.create({ car: carId, user: req.user._id, booking: bookingId, rating, title, comment });
  await Booking.findByIdAndUpdate(bookingId, { isReviewed: true });
  await review.populate('user', 'name avatar');
  res.status(201).json({ success: true, data: review });
});

exports.updateReview = asyncHandler(async (req, res) => {
  let review = await Review.findById(req.params.id);
  if (!review) { res.status(404); throw new Error('Review not found'); }
  if (review.user.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }
  review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('user', 'name avatar');
  res.json({ success: true, data: review });
});

exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) { res.status(404); throw new Error('Review not found'); }
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') { res.status(403); throw new Error('Not authorized'); }
  await review.deleteOne();
  res.json({ success: true, message: 'Review deleted' });
});
