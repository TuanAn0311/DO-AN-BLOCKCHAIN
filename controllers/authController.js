const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// [POST] /api/auth/register
const register = async (req, res) => {
    try {
        // BẢO MẬT: KHÔNG lấy 'role' từ frontend để tránh leo thang đặc quyền
        const { email, password, full_name, phone } = req.body;

        // 1. Validate cơ bản
        if (!email || !password || !full_name) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc!' });
        }

        // 2. Kiểm tra email đã tồn tại chưa
        const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: 'Email này đã được sử dụng!' });
        }
        
        // 3. Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 4. Cấu hình mặc định an toàn
        const userRole = 'user'; // Bắt buộc đăng ký ngoài web chỉ được làm user
        const provider = 'local'; // Đánh dấu đây là tài khoản đăng ký bằng form thường

        // 5. Lưu vào Database
        const [result] = await db.execute(
            'INSERT INTO users (email, password, full_name, phone, role, provider) VALUES (?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, full_name, phone || null, userRole, provider]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Đăng ký thành công!',
            userId: result.insertId,
            role: userRole
        });

    } catch (error) {
        console.error('Lỗi Register:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký!' });
    }
};

// [POST] /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Vui lòng nhập email và mật khẩu!" });
    }

    // 1. Tìm user theo email
    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(400).json({ success: false, message: "Email hoặc mật khẩu không đúng!" });
    }

    const user = users[0];

    // 2. BẢO MẬT TỐI ĐA: Chặn đăng nhập bằng form nếu tài khoản thuộc về Google
    if (user.provider && user.provider !== "local") {
        return res.status(400).json({ 
            success: false, 
            message: "Tài khoản này được liên kết với Google. Vui lòng bấm Đăng nhập bằng Google!" 
        });
    }

    // 3. Kiểm tra mật khẩu (Lúc này chắc chắn là tài khoản local)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Email hoặc mật khẩu không đúng!" });
    }

    // 4. Tạo JWT Token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role, // Payload chứa role để Middleware biết ai là Admin
    };
    
    // Token sống trong 7 ngày
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // 5. Dọn dẹp dữ liệu nhạy cảm trước khi gửi về Frontend
    delete user.password;

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      token,
      user,
    });
  } catch (error) {
    console.error("Lỗi Login:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi đăng nhập!" });
  }
};

const getMe = async (req, res) => {
  try {
    const [users] = await db.execute(
      "SELECT id, email, full_name, phone, avatar, role, provider, created_at FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "Không tìm thấy người dùng!" });
    }

    res.json({ success: true, data: users[0] });
  } catch (error) {
    console.error("Lỗi getMe:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi tải hồ sơ!" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, full_name, phone, avatar } = req.body;

    if (!email || !full_name) {
      return res.status(400).json({ success: false, message: "Email và họ tên là bắt buộc!" });
    }

    const [existingUsers] = await db.execute(
      "SELECT id FROM users WHERE email = ? AND id <> ?",
      [email, userId]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: "Email này đã được sử dụng!" });
    }

    await db.execute(
      "UPDATE users SET email = ?, full_name = ?, phone = ?, avatar = ? WHERE id = ?",
      [email, full_name, phone || null, avatar || null, userId]
    );

    const [users] = await db.execute(
      "SELECT id, email, full_name, phone, avatar, role, provider, created_at FROM users WHERE id = ?",
      [userId]
    );

    res.json({ success: true, message: "Cập nhật hồ sơ thành công!", data: users[0] });
  } catch (error) {
    console.error("Lỗi updateProfile:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi cập nhật hồ sơ!" });
  }
};

module.exports = { register, login, getMe, updateProfile };
