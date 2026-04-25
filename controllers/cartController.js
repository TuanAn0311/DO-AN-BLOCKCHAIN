const db = require('../config/db');

// [POST] /api/cart/add
exports.addToCart = async (req, res) => {
    try {
        const { product_id, quantity } = req.body;
        const user_id = req.user.id; // Lấy từ Token đã verify

        // 1. Kiểm tra sản phẩm đã có trong giỏ chưa
        const [items] = await db.execute(
            'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
            [user_id, product_id]
        );

        if (items.length > 0) {
            // 2. Nếu có rồi -> Update số lượng
            await db.execute(
                'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
                [quantity || 1, user_id, product_id]
            );
        } else {
            // 3. Nếu chưa có -> Thêm mới
            await db.execute(
                'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [user_id, product_id, quantity || 1]
            );
        }
        res.json({ success: true, message: 'Đã thêm vào giỏ hàng!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [GET] /api/cart
exports.getCart = async (req, res) => {
    try {
        const user_id = req.user.id;
        const [cartItems] = await db.execute(
            `SELECT cart.id, products.name, products.price, products.image, cart.quantity 
             FROM cart JOIN products ON cart.product_id = products.id 
             WHERE cart.user_id = ?`,
            [user_id]
        );
        res.json({ success: true, data: cartItems });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [POST] /api/cart/checkout
exports.checkout = async (req, res) => {
    try {
        const user_id = req.user.id;
        // 1. Lấy thông tin giỏ hàng của user
        const [cart] = await db.execute('SELECT * FROM cart WHERE user_id = ?', [user_id]);
        if (cart.length === 0) {
            return res.status(400).json({ success: false, message: 'Giỏ hàng trống!' });
        }
        res.json({ success: true, message: 'Đặt hàng thành công!' });

        // 2. Xử lý thanh toán (Ở đây ta sẽ giả lập thành công luôn)  
    }catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

