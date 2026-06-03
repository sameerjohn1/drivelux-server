const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const carRoutes = require('./routes/carRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const driverRoutes = require('./routes/driverRoutes');
const adminRoutes = require('./routes/adminRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

connectDB();

const app = express();
const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const onlineUsers = new Map();

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('userOnline', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
  });

  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
  });

  socket.on('sendMessage', (data) => {
    io.to(data.conversationId).emit('receiveMessage', data);
  });

  socket.on('typing', (data) => {
    socket.to(data.conversationId).emit('userTyping', data);
  });

  socket.on('stopTyping', (data) => {
    socket.to(data.conversationId).emit('userStopTyping', data);
  });

  socket.on('bookingUpdate', (data) => {
    if (data.userId && onlineUsers.has(data.userId)) {
      io.to(onlineUsers.get(data.userId)).emit('bookingStatusUpdate', data);
    }
  });

  socket.on('sendNotification', (data) => {
    if (data.userId && onlineUsers.has(data.userId)) {
      io.to(onlineUsers.get(data.userId)).emit('newNotification', data);
    }
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

app.set('io', io);
app.set('onlineUsers', onlineUsers);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(helmet());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use('/api', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date() });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = { app, io };
