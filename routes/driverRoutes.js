const express = require('express');
const router = express.Router();
const { getDriverProfile, createDriverProfile, updateDriverProfile, getDriverBookings, getDriverEarnings, toggleAvailability } = require('../controllers/driverController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.get('/profile', getDriverProfile);
router.post('/profile', authorize('driver', 'admin'), createDriverProfile);
router.put('/profile', authorize('driver', 'admin'), updateDriverProfile);
router.get('/bookings', authorize('driver'), getDriverBookings);
router.get('/earnings', authorize('driver'), getDriverEarnings);
router.put('/availability', authorize('driver'), toggleAvailability);

module.exports = router;
