const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const APIFeatures = require('../utils/apiFeatures');

exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const fieldsToUpdate = { name: req.body.name, phone: req.body.phone, address: req.body.address };
  Object.keys(fieldsToUpdate).forEach(k => fieldsToUpdate[k] === undefined && delete fieldsToUpdate[k]);
  const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, { new: true, runValidators: true });
  res.json({ success: true, data: user });
});

exports.updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) { res.status(400); throw new Error('Please upload an image'); }
  const user = await User.findByIdAndUpdate(req.user._id, { avatar: req.file.path, avatarPublicId: req.file.filename }, { new: true });
  res.json({ success: true, data: user });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(req.body.currentPassword))) { res.status(401); throw new Error('Current password incorrect'); }
  user.password = req.body.newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { isActive: false });
  res.json({ success: true, message: 'Account deactivated' });
});
