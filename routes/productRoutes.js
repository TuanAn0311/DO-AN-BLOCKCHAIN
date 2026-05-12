const express = require("express"); // Tạo router để định nghĩa các route liên quan đến sản phẩm

const router = express.Router();
const productController = require("../controllers/productController");
const { verifyAdmin } = require("../middlewares/authMiddleware");

router.get("/", productController.getAllProducts);
router.post("/", verifyAdmin, productController.createProduct); // Chỉ admin mới vào được
router.get("/:id", productController.getProductById); // Lấy chi tiết sản phẩm, bao gồm cả lịch sử giao dịch trên blockchain
router.put("/update/:id", verifyAdmin, productController.updateProduct); // Chỉ admin mới vào được
router.delete("/:id", verifyAdmin, productController.deleteProduct); // Chỉ admin mới vào được 
router.put("/activate/:id",verifyAdmin,productController.activateProduct); // Chỉ admin mới vào được

module.exports = router;
