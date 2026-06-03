const express = require('express');
const router = express.Router();
const { getReviews, createReview, updateReview, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middlewares/auth');

router.get('/', getReviews);
router.get('/car/:carId', getReviews);
router.post('/', protect, createReview);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
