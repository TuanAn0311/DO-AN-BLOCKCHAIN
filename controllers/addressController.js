const db = require('../config/db'); // Đường dẫn tới file kết nối MySQL của bạn

// 1. Lấy danh sách địa chỉ của user đang đăng nhập
exports.getUserAddresses = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy từ middleware verifyToken
        
        // Lấy danh sách, ưu tiên địa chỉ mặc định (is_default = 1) lên đầu
        const [addresses] = await db.execute(
            'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC', 
            [userId]
        );
        
        res.json({ success: true, data: addresses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Thêm địa chỉ mới
exports.addAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, phone, address_line, city, district, is_default } = req.body;

        // Nếu user chọn đây là địa chỉ mặc định, ta phải chuyển các địa chỉ cũ thành 0
        if (is_default === 1) {
            await db.execute('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
        }

        // Kiểm tra xem user đã có địa chỉ nào chưa, nếu chưa có thì bắt buộc cái đầu tiên phải là mặc định
        const [existing] = await db.execute('SELECT id FROM user_addresses WHERE user_id = ?', [userId]);
        const finalIsDefault = (existing.length === 0 || is_default === 1) ? 1 : 0;

        await db.execute(
            'INSERT INTO user_addresses (user_id, full_name, phone, address_line, city, district, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, full_name, phone, address_line, city, district, finalIsDefault]
        );

        res.json({ success: true, message: 'Thêm địa chỉ thành công!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};