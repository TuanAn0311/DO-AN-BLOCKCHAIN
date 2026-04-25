const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");

// [POST] /api/auth/register
const register = async (req, res) => {
    try {
        // Thêm trường 'role' vào đây
        const { email, password, full_name, phone, role } = req.body;

        const [existingUsers] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ success: false, message: 'Email đã được sử dụng!' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Xác định role: Nếu người dùng có gửi 'role' lên (và là admin/user) thì dùng, nếu không mặc định là 'user'
        const userRole = (role === 'admin') ? 'admin' : 'user';

        // Cập nhật câu lệnh SQL để lưu role vào Database
        const [result] = await db.execute(
            'INSERT INTO users (email, password, full_name, phone, role) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, full_name, phone || null, userRole]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Đăng ký thành công!',
            userId: result.insertId,
            role: userRole // Trả về luôn role để bạn dễ kiểm tra
        });

    } catch (error) {
        console.error('Lỗi Register:', error);
        res.status(500).json({ success: false, message: 'Lỗi server!' });
    }
};

// [POST] /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Tìm user theo email
    const [users] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Email hoặc mật khẩu không đúng!" });
    }

    const user = users[0];

    // 2. Kiểm tra mật khẩu (Chỉ check nếu đăng nhập bằng 'local', không phải 'google')
    if (user.provider === "local") {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: "Email hoặc mật khẩu không đúng!" });
      }
    }

    // 3. Tạo JWT Token
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    // Token sống trong 7 ngày
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // 4. Xóa field password trước khi trả data về Frontend (Bảo mật)
    delete user.password;

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công!",
      token,
      user,
    });
  } catch (error) {
    console.error("Lỗi Login:", error);
    res.status(500).json({ success: false, message: "Lỗi server!" });
  }
};

module.exports = { register, login };
