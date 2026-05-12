const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const { verifyToken } = require('../middlewares/authMiddleware'); // Đảm bảo bạn có middleware này để lấy req.user.id

// Phải đăng nhập mới được thao tác với địa chỉ
router.get('/', verifyToken, addressController.getUserAddresses);
router.post('/', verifyToken, addressController.addAddress);

module.exports = router;