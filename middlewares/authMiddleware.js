// this middleware sẽ kiểm tra token JWT trong header của request để xác thực người dùng
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // Lấy token từ header "Authorization: Bearer <token>"
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Từ chối truy cập. Vui lòng đăng nhập!",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Gắn thông tin user vào request để các Controller sau dùng
    next(); // Cho phép đi tiếp vào Controller
  } catch (error) {
    res
      .status(403)
      .json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn!" });
  }
};

// Phân quyền: Chỉ Admin mới được đi qua (Dùng cho API tạo sản phẩm, ghi Blockchain)
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role === "admin") {
      next();
    } else {
      res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền Admin!" });
    }
  });
};

module.exports = { verifyToken, verifyAdmin };
