const express = require('express');
const router = express.Router();
const { getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middlewares/auth');

router.use(protect);
router.get('/', getWishlist);
router.post('/:carId', addToWishlist);
router.delete('/:carId', removeFromWishlist);

module.exports = router;
