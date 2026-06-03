const asyncHandler = require('express-async-handler');
const Car = require('../models/Car');
const APIFeatures = require('../utils/apiFeatures');

exports.getCars = asyncHandler(async (req, res) => {
  const features = new APIFeatures(Car.find({ isAvailable: true }).populate('owner', 'name avatar').populate('driver'), req.query)
    .filter()
    .search(['name', 'brand', 'model', 'location.city'])
    .sort()
    .limitFields()
    .paginate();

  const cars = await features.query;
  const total = await Car.countDocuments({ isAvailable: true });
  res.json({ success: true, count: cars.length, total, page: features.page, limit: features.limit, data: cars });
});

exports.getCar = asyncHandler(async (req, res) => {
  const car = await Car.findById(req.params.id).populate('owner', 'name avatar phone').populate('driver');
  if (!car) { res.status(404); throw new Error('Car not found'); }
  res.json({ success: true, data: car });
});

exports.createCar = asyncHandler(async (req, res) => {
  req.body.owner = req.user._id;
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map(f => ({ url: f.path, publicId: f.filename }));
  }
  const car = await Car.create(req.body);
  res.status(201).json({ success: true, data: car });
});

exports.updateCar = asyncHandler(async (req, res) => {
  let car = await Car.findById(req.params.id);
  if (!car) { res.status(404); throw new Error('Car not found'); }
  if (car.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorized');
  }
  if (req.files && req.files.length > 0) {
    req.body.images = [...(car.images || []), ...req.files.map(f => ({ url: f.path, publicId: f.filename }))];
  }
  car = await Car.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data: car });
});

exports.deleteCar = asyncHandler(async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) { res.status(404); throw new Error('Car not found'); }
  if (car.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403); throw new Error('Not authorized');
  }
  await car.deleteOne();
  res.json({ success: true, message: 'Car deleted' });
});

exports.getFeaturedCars = asyncHandler(async (req, res) => {
  const cars = await Car.find({ isAvailable: true, isVerified: true }).sort('-rating -totalBookings').limit(8);
  res.json({ success: true, data: cars });
});

exports.getPopularCars = asyncHandler(async (req, res) => {
  const cars = await Car.find({ isAvailable: true }).sort('-totalBookings').limit(12);
  res.json({ success: true, data: cars });
});

exports.getMyCars = asyncHandler(async (req, res) => {
  const cars = await Car.find({ owner: req.user._id });
  res.json({ success: true, count: cars.length, data: cars });
});

exports.toggleAvailability = asyncHandler(async (req, res) => {
  const car = await Car.findById(req.params.id);
  if (!car) { res.status(404); throw new Error('Car not found'); }
  car.isAvailable = !car.isAvailable;
  await car.save();
  res.json({ success: true, data: car });
});
