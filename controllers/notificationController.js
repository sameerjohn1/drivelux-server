const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

exports.getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const notifications = await Notification.find({ recipient: req.user._id }).populate('sender', 'name avatar').sort('-createdAt').skip(skip).limit(limit);
  const total = await Notification.countDocuments({ recipient: req.user._id });
  const unread = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
  res.json({ success: true, count: notifications.length, total, unread, data: notifications });
});

exports.markRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
  res.json({ success: true, message: 'Notification marked as read' });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true, readAt: new Date() });
  res.json({ success: true, message: 'All notifications marked as read' });
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Notification deleted' });
});
