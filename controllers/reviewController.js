const db = require('../config/db');

// Thêm đánh giá mới
exports.addReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { product_id, rating, comment } = req.body;

        if (!product_id) {
            return res.status(400).json({ success: false, message: "Thiếu ID sản phẩm! Vui lòng thử lại." });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: "Vui lòng chọn số sao từ 1 đến 5!" });
        }

        // BẢO MẬT: Kiểm tra xem user này đã thực sự mua và ĐÃ NHẬN sản phẩm này chưa
        const [checkPurchased] = await db.execute(`
            SELECT od.id 
            FROM order_details od 
            JOIN orders o ON od.order_id = o.id 
            WHERE o.user_id = ? AND od.product_id = ? AND o.status = 'delivered'
        `, [userId, product_id]);

        if (checkPurchased.length === 0) {
            return res.status(403).json({ success: false, message: "Bạn phải nhận hàng thành công mới được đánh giá!" });
        }

        // Lưu đánh giá vào CSDL
        await db.execute(
            'INSERT INTO reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
            [product_id, userId, rating, comment]
        );

        res.json({ success: true, message: 'Cảm ơn bạn đã đánh giá sản phẩm!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy toàn bộ đánh giá của một sản phẩm
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;

        // Lấy đánh giá kèm theo tên user từ bảng users
        const [reviews] = await db.execute(`
            SELECT r.*, u.full_name 
            FROM reviews r 
            JOIN users u ON r.user_id = u.id 
            WHERE r.product_id = ? 
            ORDER BY r.created_at DESC
        `, [productId]);

        res.json({ success: true, data: reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};