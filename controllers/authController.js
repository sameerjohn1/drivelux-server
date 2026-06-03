const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendTokenResponse, generateRefreshToken, generateAccessToken } = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const allowedRole = ['user', 'driver'].includes(role) ? role : 'user';
  const user = await User.create({ name, email, password, role: allowedRole });
  const verifyToken = user.getEmailVerifyToken();
  await user.save({ validateBeforeSave: false });

  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${verifyToken}`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Verify your email - CarBooking2026',
      html: `<h2>Welcome ${user.name}!</h2><p>Click <a href="${verifyUrl}">here</a> to verify your email. Link expires in 24 hours.</p>`,
    });
  } catch (e) {}

  sendTokenResponse(user, 201, res);
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400); throw new Error('Email and password are required'); }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) { res.status(401); throw new Error('Invalid credentials'); }
  if (!user.isActive) { res.status(403); throw new Error('Account deactivated'); }

  user.lastLogin = Date.now();
  const refreshToken = generateRefreshToken(user._id);
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

exports.logout = asyncHandler(async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
  }
  res.cookie('token', 'none', { expires: new Date(Date.now() + 5 * 1000), httpOnly: true });
  res.json({ success: true, message: 'Logged out successfully' });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) { res.status(401); throw new Error('Refresh token required'); }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id).select('+refreshToken');
  if (!user || user.refreshToken !== refreshToken) { res.status(401); throw new Error('Invalid refresh token'); }

  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ emailVerifyToken: hashedToken, emailVerifyExpire: { $gt: Date.now() } });
  if (!user) { res.status(400); throw new Error('Invalid or expired token'); }

  user.isEmailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpire = undefined;
  await user.save();
  res.json({ success: true, message: 'Email verified successfully' });
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) { res.status(404); throw new Error('No account with that email'); }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Reset - CarBooking2026',
      html: `<h2>Reset Password</h2><p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
    });
    res.json({ success: true, message: 'Reset email sent' });
  } catch (e) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500); throw new Error('Email could not be sent');
  }
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) { res.status(400); throw new Error('Invalid or expired token'); }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  sendTokenResponse(user, 200, res);
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: user });
});
