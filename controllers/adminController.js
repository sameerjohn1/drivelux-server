const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Car = require('../models/Car');
const Booking = require('../models/Booking');
const Driver = require('../models/Driver');
const Review = require('../models/Review');
const Payment = require('../models/Payment');

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [totalUsers, totalCars, totalBookings, totalDrivers, recentBookings, revenueData] = await Promise.all([
    User.countDocuments({ role: 'user' }),
    Car.countDocuments(),
    Booking.countDocuments(),
    Driver.countDocuments(),
    Booking.find().populate('car', 'name').populate('user', 'name').sort('-createdAt').limit(10),
    Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]),
  ]);
  const totalRevenue = await Booking.aggregate([{ $match: { status: 'completed' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]);
  res.json({
    success: true,
    data: {
      stats: { totalUsers, totalCars, totalBookings, totalDrivers, totalRevenue: totalRevenue[0]?.total || 0 },
      recentBookings,
      revenueData,
    },
  });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = req.query.role ? { role: req.query.role } : {};
  if (req.query.search) filter.$or = [{ name: new RegExp(req.query.search, 'i') }, { email: new RegExp(req.query.search, 'i') }];
  const users = await User.find(filter).sort('-createdAt').skip(skip).limit(limit);
  const total = await User.countDocuments(filter);
  res.json({ success: true, count: users.length, total, data: users });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, data: user });
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!user) { res.status(404); throw new Error('User not found'); }
  res.json({ success: true, message: 'User deactivated' });
});

exports.getAllCars = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const cars = await Car.find().populate('owner', 'name email').sort('-createdAt').skip(skip).limit(limit);
  const total = await Car.countDocuments();
  res.json({ success: true, count: cars.length, total, data: cars });
});

exports.verifyCar = asyncHandler(async (req, res) => {
  const car = await Car.findByIdAndUpdate(req.params.id, { isVerified: req.body.isVerified }, { new: true });
  if (!car) { res.status(404); throw new Error('Car not found'); }
  res.json({ success: true, data: car });
});

exports.getAllBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const filter = req.query.status ? { status: req.query.status } : {};
  const bookings = await Booking.find(filter).populate('car', 'name brand').populate('user', 'name email').sort('-createdAt').skip(skip).limit(limit);
  const total = await Booking.countDocuments(filter);
  res.json({ success: true, count: bookings.length, total, data: bookings });
});

exports.getAllDrivers = asyncHandler(async (req, res) => {
  const drivers = await Driver.find().populate('user', 'name email avatar phone');
  res.json({ success: true, count: drivers.length, data: drivers });
});

exports.verifyDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findByIdAndUpdate(req.params.id, { isVerified: req.body.isVerified }, { new: true });
  if (!driver) { res.status(404); throw new Error('Driver not found'); }
  res.json({ success: true, data: driver });
});

exports.getAllReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find().populate('user', 'name avatar').populate('car', 'name brand').sort('-createdAt');
  res.json({ success: true, count: reviews.length, data: reviews });
});

exports.deleteReview = asyncHandler(async (req, res) => {
  await Review.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Review deleted' });
});
