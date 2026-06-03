const asyncHandler = require('express-async-handler');
const Wishlist = require('../models/Wishlist');

exports.getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id }).populate('cars');
  if (!wishlist) wishlist = { cars: [] };
  res.json({ success: true, data: wishlist });
});

exports.addToWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user._id, cars: [req.params.carId] });
  } else {
    if (wishlist.cars.includes(req.params.carId)) {
      res.status(400); throw new Error('Car already in wishlist');
    }
    wishlist.cars.push(req.params.carId);
    await wishlist.save();
  }
  await wishlist.populate('cars');
  res.json({ success: true, data: wishlist });
});

exports.removeFromWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) { res.status(404); throw new Error('Wishlist not found'); }
  wishlist.cars = wishlist.cars.filter((c) => c.toString() !== req.params.carId);
  await wishlist.save();
  res.json({ success: true, message: 'Car removed from wishlist' });
});
