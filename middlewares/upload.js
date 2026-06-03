const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'car-booking/avatars', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] },
});

const carStorage = new CloudinaryStorage({
  cloudinary,
  params: { folder: 'car-booking/cars', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

exports.uploadAvatar = multer({ storage: avatarStorage, fileFilter, limits: { fileSize: 2 * 1024 * 1024 } }).single('avatar');
exports.uploadCarImages = multer({ storage: carStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).array('images', 10);
exports.cloudinary = cloudinary;
