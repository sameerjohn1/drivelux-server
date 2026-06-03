const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, updateAvatar, changePassword, deleteAccount } = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const { uploadAvatar } = require('../middlewares/upload');

router.use(protect);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/avatar', uploadAvatar, updateAvatar);
router.put('/change-password', changePassword);
router.delete('/account', deleteAccount);

module.exports = router;
