const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route yêu cầu đăng nhập mới được đánh giá
router.post('/', verifyToken, reviewController.addReview);
router.get('/:productId', reviewController.getProductReviews);

module.exports = router;