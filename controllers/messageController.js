const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

exports.getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate('participants', 'name avatar')
    .populate('lastMessage')
    .sort('-lastMessageAt');
  res.json({ success: true, data: conversations });
});

exports.getOrCreateConversation = asyncHandler(async (req, res) => {
  const { participantId, bookingId } = req.body;
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, participantId] },
  }).populate('participants', 'name avatar');

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, participantId],
      booking: bookingId || undefined,
    });
    await conversation.populate('participants', 'name avatar');
  }
  res.json({ success: true, data: conversation });
});

exports.getMessages = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30;
  const skip = (page - 1) * limit;
  const messages = await Message.find({ conversation: req.params.conversationId, isDeleted: false })
    .populate('sender', 'name avatar')
    .sort('-createdAt').skip(skip).limit(limit);
  await Message.updateMany(
    { conversation: req.params.conversationId, seenBy: { $ne: req.user._id } },
    { $addToSet: { seenBy: req.user._id } }
  );
  res.json({ success: true, data: messages.reverse() });
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const { conversationId, content, type } = req.body;
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) { res.status(404); throw new Error('Conversation not found'); }

  const message = await Message.create({
    conversation: conversationId, sender: req.user._id, content, type: type || 'text',
    seenBy: [req.user._id],
  });
  conversation.lastMessage = message._id;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  await message.populate('sender', 'name avatar');

  const recipientId = conversation.participants.find(p => p.toString() !== req.user._id.toString());
  if (recipientId) {
    await Notification.create({
      recipient: recipientId,
      sender: req.user._id,
      type: 'chat',
      title: 'New Message',
      message: `${req.user.name || 'Someone'}: ${content.substring(0, 100)}`,
      data: { conversationId: conversation._id },
    });

    const io = req.app.get('io');
    if (io) {
      io.to(conversationId).emit('receiveMessage', message);
      const onlineUsers = req.app.get('onlineUsers');
      if (onlineUsers && onlineUsers.has(recipientId.toString())) {
        io.to(onlineUsers.get(recipientId.toString())).emit('newNotification', { type: 'chat', title: 'New Message' });
      }
    }
  } else if (req.app.get('io')) {
    req.app.get('io').to(conversationId).emit('receiveMessage', message);
  }

  res.status(201).json({ success: true, data: message });
});

exports.deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) { res.status(404); throw new Error('Conversation not found'); }
  if (!conversation.participants.some(p => p.toString() === req.user._id.toString())) {
    res.status(403); throw new Error('Not authorized');
  }
  await Message.deleteMany({ conversation: conversation._id });
  await Conversation.findByIdAndDelete(conversation._id);
  res.json({ success: true, message: 'Conversation deleted' });
});

exports.deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);
  if (!message) { res.status(404); throw new Error('Message not found'); }
  if (message.sender.toString() !== req.user._id.toString()) { res.status(403); throw new Error('Not authorized'); }
  message.isDeleted = true;
  message.content = 'This message was deleted';
  await message.save();
  res.json({ success: true, message: 'Message deleted' });
});
