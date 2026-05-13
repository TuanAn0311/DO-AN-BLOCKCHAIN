const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Khách Hàng
router.post('/checkout', verifyToken, orderController.placeOrder); // Khách hàng đặt hàng
router.put('/user/confirm-received/:id', verifyToken, orderController.confirmReceivedByUser);

// Admin
router.get('/admin/all', verifyToken, orderController.getAllOrdersAdmin); // Admin xem tất cả đơn hàng
router.get('/admin/:id', verifyToken, orderController.getAllOrdersDetailAdmin); // Admin xem chi tiết đơn hàng
router.put('/admin/:id/status', verifyToken, orderController.updateOrderStatus); // Admin cập nhật trạng thái đơn hàng
router.get('/admin/dashboard/stats', verifyToken, orderController.getDashboardStats); // Admin xem thống kê dashboard

module.exports = router;