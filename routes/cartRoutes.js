const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { verifyToken } = require("../middlewares/authMiddleware");

router.use(verifyToken); // Áp dụng cho tất cả route bên dưới
router.post("/add", cartController.addToCart);
router.get("/", cartController.getCart);
router.post("/checkout", cartController.checkout);
router.get("/orders", cartController.getUserOrders);
router.get("/orders/:orderId", cartController.getOrderDetails);
router.put('/update', cartController.updateQuantity);
router.delete('/remove/:productId', cartController.removeItem);

module.exports = router;
