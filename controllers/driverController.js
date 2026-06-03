const asyncHandler = require('express-async-handler');
const Driver = require('../models/Driver');
const Booking = require('../models/Booking');

exports.getDriverProfile = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ user: req.user._id }).populate('user', 'name email avatar phone');
  if (!driver) { res.status(404); throw new Error('Driver profile not found'); }
  res.json({ success: true, data: driver });
});

exports.createDriverProfile = asyncHandler(async (req, res) => {
  const exists = await Driver.findOne({ user: req.user._id });
  if (exists) { res.status(400); throw new Error('Driver profile already exists'); }
  const driver = await Driver.create({ ...req.body, user: req.user._id });
  res.status(201).json({ success: true, data: driver });
});

exports.updateDriverProfile = asyncHandler(async (req, res) => {
  const driver = await Driver.findOneAndUpdate({ user: req.user._id }, req.body, { new: true, runValidators: true }).populate('user', 'name email avatar phone');
  if (!driver) { res.status(404); throw new Error('Driver profile not found'); }
  res.json({ success: true, data: driver });
});

exports.getDriverBookings = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ user: req.user._id });
  if (!driver) { res.status(404); throw new Error('Driver profile not found'); }
  const bookings = await Booking.find({ driver: driver._id }).populate('car', 'name brand images').populate('user', 'name avatar').sort('-createdAt');
  res.json({ success: true, count: bookings.length, data: bookings });
});

exports.getDriverEarnings = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ user: req.user._id });
  if (!driver) { res.status(404); throw new Error('Driver profile not found'); }
  const completed = await Booking.find({ driver: driver._id, status: 'completed' });
  const totalEarnings = completed.reduce((sum, b) => sum + b.totalAmount * 0.8, 0);
  const monthlyEarnings = await Booking.aggregate([
    { $match: { driver: driver._id, status: 'completed' } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, total: { $sum: '$totalAmount' } } },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 },
  ]);
  res.json({ success: true, data: { totalEarnings, completedBookings: completed.length, monthlyEarnings } });
});

exports.toggleAvailability = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ user: req.user._id });
  if (!driver) { res.status(404); throw new Error('Driver profile not found'); }
  driver.isAvailable = !driver.isAvailable;
  await driver.save();
  res.json({ success: true, data: driver });
});
