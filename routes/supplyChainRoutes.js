const express = require("express"); // Tạo router để định nghĩa các route liên quan đến chuỗi cung ứng
const router = express.Router(); // Import controller để xử lý logic nghiệp vụ

const supplyChainController = require("../controllers/supplyChainController");
const { verifyAdmin } = require("../middlewares/authMiddleware");

// Chỉ Admin mới được quyền ghi dữ liệu chuỗi cung ứng
router.post("/stage", verifyAdmin, supplyChainController.addStage);

// Lấy mã Hash để chuẩn bị deploy
router.get('/generate-hash/:productId', supplyChainController.generateHash);

// Lưu lại record sau khi MetaMask hoàn tất
router.post("/record", verifyAdmin, supplyChainController.saveBlockchainRecord);

//Thêm API lấy toàn bộ lịch sử chuỗi cung ứng của 1 sản phẩm (Dùng cho trang chi tiết sản phẩm)
router.get('/history/:productId', supplyChainController.getHistory);

module.exports = router;
