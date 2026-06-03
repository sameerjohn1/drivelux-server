const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 50 },
    email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Invalid email'] },
    password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
    role: { type: String, enum: ['user', 'driver', 'admin'], default: 'user' },
    avatar: { type: String, default: '' },
    avatarPublicId: { type: String },
    phone: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerifyToken: String,
    emailVerifyExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    refreshToken: { type: String, select: false },
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
    notificationPreferences: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getEmailVerifyToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerifyToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerifyExpire = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

userSchema.methods.getResetPasswordToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
  return token;
};

module.exports = mongoose.model('User', userSchema);
