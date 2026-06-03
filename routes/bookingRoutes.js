const express = require('express');
const router = express.Router();
const { createBooking, getBookings, getBooking, updateBookingStatus, getUserBookings, getUpcomingBookings } = require('../controllers/bookingController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.post('/', createBooking);
router.get('/', authorize('admin'), getBookings);
router.get('/my-bookings', getUserBookings);
router.get('/upcoming', getUpcomingBookings);
router.get('/:id', getBooking);
router.put('/:id/status', updateBookingStatus);

module.exports = router;
