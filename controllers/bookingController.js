const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Car = require('../models/Car');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const APIFeatures = require('../utils/apiFeatures');

exports.createBooking = asyncHandler(async (req, res) => {
  const { carId, startDate, endDate, pickupLocation, dropoffLocation, paymentMethod, notes } = req.body;
  const car = await Car.findById(carId);
  if (!car) { res.status(404); throw new Error('Car not found'); }
  if (!car.isAvailable) { res.status(400); throw new Error('Car is not available'); }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (totalDays < 1) { res.status(400); throw new Error('Invalid dates'); }

  const conflict = await Booking.findOne({
    car: carId, status: { $in: ['pending', 'approved', 'active'] },
    $or: [{ startDate: { $lte: end }, endDate: { $gte: start } }],
  });
  if (conflict) { res.status(400); throw new Error('Car already booked for these dates'); }

  const totalAmount = totalDays * car.pricePerDay;
  const booking = await Booking.create({
    car: carId, user: req.user._id, startDate: start, endDate: end,
    pickupLocation, dropoffLocation, totalDays, pricePerDay: car.pricePerDay,
    totalAmount, paymentMethod: paymentMethod || 'cash', notes,
    driver: car.driver,
  });

  await Notification.create({
    recipient: car.owner, sender: req.user._id, type: 'booking',
    title: 'New Booking Request', message: `New booking for ${car.name}`,
    data: { bookingId: booking._id },
  });

  if (req.app.get('io')) {
    req.app.get('io').emit('bookingUpdate', { userId: car.owner.toString(), booking });
  }

  await booking.populate(['car', 'user']);
  res.status(201).json({ success: true, data: booking });
});

exports.getBookings = asyncHandler(async (req, res) => {
  let filter = {};
  if (req.user.role === 'user') filter.user = req.user._id;
  else if (req.user.role === 'driver') filter.driver = req.user._id;

  const features = new APIFeatures(Booking.find(filter).populate('car', 'name brand images pricePerDay').populate('user', 'name avatar'), req.query)
    .filter().sort().paginate();

  const bookings = await features.query;
  const total = await Booking.countDocuments(filter);
  res.json({ success: true, count: bookings.length, total, data: bookings });
});

exports.getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('car').populate('user', 'name avatar email phone').populate('driver');
  if (!booking) { res.status(404); throw new Error('Booking not found'); }
  res.json({ success: true, data: booking });
});

exports.updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, cancellationReason } = req.body;
  const booking = await Booking.findById(req.params.id).populate('car');
  if (!booking) { res.status(404); throw new Error('Booking not found'); }

  booking.status = status;
  if (status === 'cancelled') {
    booking.cancellationReason = cancellationReason;
    booking.cancelledBy = req.user._id;
    booking.cancelledAt = new Date();
    await Car.findByIdAndUpdate(booking.car._id, { $pull: { unavailableDates: { _id: booking._id } } });
  }
  if (status === 'completed') {
    await Car.findByIdAndUpdate(booking.car._id, { $inc: { totalBookings: 1 } });
  }
  await booking.save();

  await Notification.create({
    recipient: booking.user, type: 'booking',
    title: 'Booking Status Updated', message: `Your booking status is now: ${status}`,
    data: { bookingId: booking._id, status },
  });

  if (req.app.get('io')) {
    req.app.get('io').emit('bookingUpdate', { userId: booking.user.toString(), booking });
  }

  res.json({ success: true, data: booking });
});

exports.getUserBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('car', 'name brand images pricePerDay location owner')
    .populate({ path: 'driver', select: 'user', populate: { path: 'user', select: 'name email avatar' } })
    .sort('-createdAt');
  res.json({ success: true, count: bookings.length, data: bookings });
});

exports.getUpcomingBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id, startDate: { $gte: new Date() }, status: { $in: ['pending', 'approved'] } }).populate('car', 'name brand images').sort('startDate');
  res.json({ success: true, data: bookings });
});
