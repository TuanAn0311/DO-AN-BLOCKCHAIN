const db = require('../config/db');
const sendEmail = require('../utils/sendEmail'); 

//======================================
// HÀM ĐẶT HÀNG (CHECKOUT) DÀNH CHO KHÁCH HÀNG
//======================================
exports.placeOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { address_id, payment_method } = req.body;

        // 1. Kiểm tra địa chỉ có tồn tại và thuộc về user này không
        const [addresses] = await db.execute('SELECT * FROM user_addresses WHERE id = ? AND user_id = ?', [address_id, userId]);
        if (addresses.length === 0) return res.status(400).json({ success: false, message: "Địa chỉ không hợp lệ!" });
        const address = addresses[0];
        
        // Gộp địa chỉ thành 1 chuỗi để lưu vào bảng orders
        const fullAddress = `${address.address_line}, ${address.district}, ${address.city}`;

        // 2. Lấy giỏ hàng của user và Tự động tính lại tổng tiền
        const [cartItems] = await db.execute(
            'SELECT c.product_id, c.quantity, p.name, p.price FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?', 
            [userId]
        );
        
        if (cartItems.length === 0) return res.status(400).json({ success: false, message: "Giỏ hàng của bạn đang trống!" });
        const total_price = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // 3. Insert vào bảng `orders`
        const [orderResult] = await db.execute(
            'INSERT INTO orders (user_id, full_name, phone, address, total_price, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, address.full_name, address.phone, fullAddress, total_price, payment_method, 'pending']
        );
        const orderId = orderResult.insertId; // Lấy ID của đơn hàng vừa tạo

        // 4. Insert vào bảng `order_details` (Lưu từng sản phẩm trong đơn)
        for (let item of cartItems) {
            await db.execute(
                'INSERT INTO order_details (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.price]
            );
            
            // TÙY CHỌN: Trừ đi số lượng tồn kho trong bảng products
            await db.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
        }

        // 5. Dọn sạch giỏ hàng của user này
        await db.execute('DELETE FROM cart WHERE user_id = ?', [userId]);
        
        // 6. Gửi Email xác nhận đơn hàng (Dùng email của user đã đăng ký)
        const [users] = await db.execute('SELECT email FROM users WHERE id = ?', [userId]);
        const userEmail = users[0].email;

        // Tạo nội dung HTML cho Email nhìn cho xịn
        let itemsHtml = cartItems.map(item => `<li>${item.name} - SL: ${item.quantity} - Đơn giá: ${Number(item.price).toLocaleString()}đ</li>`).join('');
        
        const emailContent = `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #28a745;">Cảm ơn bạn đã đặt hàng tại DNC Trace!</h2>
                <p>Mã đơn hàng của bạn là: <strong>#${orderId}</strong></p>
                <p>Phương thức thanh toán: <strong>${payment_method === 'QR' ? 'Chuyển khoản VietQR' : 'Thanh toán khi nhận hàng (COD)'}</strong></p>
                <h3>Chi tiết đơn hàng:</h3>
                <ul>${itemsHtml}</ul>
                <h3 style="color: #d9534f;">Tổng thanh toán: ${total_price.toLocaleString()} VNĐ</h3>
                <p><strong>Địa chỉ giao hàng:</strong> ${address.full_name} - ${address.phone} <br/> ${fullAddress}</p>
                <hr/>
                <p style="font-size: 12px; color: #888;">Bạn có thể theo dõi tính minh bạch của sản phẩm trên Blockchain tại website của chúng tôi.</p>
            </div>
        `;

        // Gọi hàm gửi (Dùng .catch để dù gửi email lỗi thì vẫn báo đặt hàng thành công)
        sendEmail(userEmail, `Xác nhận đơn hàng #${orderId} - DNC Trace`, emailContent).catch(console.error);
        res.json({ success: true, message: 'Đặt hàng thành công!', order_id: orderId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Khách hàng xác nhận đã nhận hàng
exports.confirmReceivedByUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // 1. Kiểm tra đơn hàng có tồn tại, thuộc về user này và đang ở trạng thái 'shipped' không
        const [orders] = await db.execute(
            'SELECT status FROM orders WHERE id = ? AND user_id = ?', 
            [id, userId]
        );

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng!" });
        }

        if (orders[0].status !== 'shipped') {
            return res.status(400).json({ success: false, message: "Đơn hàng phải ở trạng thái 'Đang giao' mới có thể xác nhận!" });
        }

        // 2. Cập nhật thành 'delivered' (Đã nhận hàng)
        await db.execute('UPDATE orders SET status = "delivered" WHERE id = ?', [id]);

        res.json({ success: true, message: 'Xác nhận đã nhận hàng thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

//======================================
// CÁC HÀM DÀNH CHO ADMIN XEM ĐƠN HÀNG
//======================================

// 1. Xem tất cả đơn hàng (dành cho admin)
exports.getAllOrdersAdmin = async (req, res) => {
    try {
        const [orders] = await db.execute('SELECT * FROM orders ORDER BY created_at DESC');
        res.json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Xem chi tiết đơn hàng (dành cho admin)
exports.getAllOrdersDetailAdmin = async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID đơn hàng từ URL
        const [details] = await db.execute(
            'SELECT od.*, p.name, p.image FROM order_details od JOIN products p ON od.product_id = p.id WHERE od.order_id = ?',
            [id]
        );
        res.json({ success: true, data: details });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Cập nhật trạng thái đơn hàng (dành cho admin)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params; // Lấy ID đơn hàng từ URL
        const {status } = req.body; // Lấy trạng thái mới từ body
        await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
        
        res.json({ success: true, message: 'Trạng thái đơn hàng đã được cập nhật!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
