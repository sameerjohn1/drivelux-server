const express = require('express');
const router = express.Router();
const { getCars, getCar, createCar, updateCar, deleteCar, getFeaturedCars, getPopularCars, getMyCars, toggleAvailability } = require('../controllers/carController');
const { protect, authorize } = require('../middlewares/auth');
const { uploadCarImages } = require('../middlewares/upload');

router.get('/', getCars);
router.get('/featured', getFeaturedCars);
router.get('/popular', getPopularCars);
router.get('/my-cars', protect, getMyCars);
router.get('/:id', getCar);
router.post('/', protect, authorize('driver', 'admin'), uploadCarImages, createCar);
router.put('/:id', protect, uploadCarImages, updateCar);
router.delete('/:id', protect, deleteCar);
router.put('/:id/toggle-availability', protect, toggleAvailability);

module.exports = router;
