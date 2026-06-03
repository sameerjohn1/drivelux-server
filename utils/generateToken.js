const jwt = require('jsonwebtoken');
const crypto = require('crypto');

exports.generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '15m' });
};

exports.generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' });
};

exports.generateEmailVerifyToken = () => crypto.randomBytes(32).toString('hex');
exports.generatePasswordResetToken = () => crypto.randomBytes(32).toString('hex');

exports.sendTokenResponse = (user, statusCode, res) => {
  const accessToken = exports.generateAccessToken(user._id);
  const refreshToken = exports.generateRefreshToken(user._id);

  const options = {
    expires: new Date(Date.now() + (process.env.COOKIE_EXPIRE || 7) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.status(statusCode).cookie('token', accessToken, options).json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    },
  });
};
