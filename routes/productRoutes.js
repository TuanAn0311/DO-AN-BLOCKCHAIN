const express = require('express'); // Tạo router để định nghĩa các route liên quan đến sản phẩm

const router = express.Router();
const productController = require('../controllers/productController');
const { verifyAdmin } = require('../middlewares/authMiddleware');

router.get('/', productController.getAllProducts);
router.post('/', verifyAdmin, productController.createProduct); // Chỉ admin mới vào được
router.get('/:id', productController.getProductById);

module.exports = router;