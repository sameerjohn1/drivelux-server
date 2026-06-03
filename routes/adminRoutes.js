const express = require('express');
const router = express.Router();
const { getDashboardStats, getAllUsers, updateUser, deleteUser, getAllCars, verifyCar, getAllBookings, getAllDrivers, verifyDriver, getAllReviews, deleteReview } = require('../controllers/adminController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect, authorize('admin'));
router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/cars', getAllCars);
router.put('/cars/:id/verify', verifyCar);
router.get('/bookings', getAllBookings);
router.get('/drivers', getAllDrivers);
router.put('/drivers/:id/verify', verifyDriver);
router.get('/reviews', getAllReviews);
router.delete('/reviews/:id', deleteReview);

module.exports = router;
