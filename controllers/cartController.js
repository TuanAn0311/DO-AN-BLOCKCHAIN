const db = require("../config/db");

// [POST] /api/cart/add
exports.addToCart = async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    const user_id = req.user.id; // Lấy từ Token đã verify

    // 1. Kiểm tra sản phẩm đã có trong giỏ chưa
    const [items] = await db.execute(
      "SELECT * FROM cart WHERE user_id = ? AND product_id = ?",
      [user_id, product_id],
    );

    if (items.length > 0) {
      // 2. Nếu có rồi -> Update số lượng
      await db.execute(
        "UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?",
        [quantity || 1, user_id, product_id],
      );
    } else {
      // 3. Nếu chưa có -> Thêm mới
      await db.execute(
        "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
        [user_id, product_id, quantity || 1],
      );
    }
    res.json({ success: true, message: "Đã thêm vào giỏ hàng!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [GET] /api/cart
exports.getCart = async (req, res) => {
  try {
    const user_id = req.user.id;
    const [cartItems] = await db.execute(
      `SELECT c.id as cart_id, c.product_id, c.quantity, p.name, p.price, p.image 
            FROM cart c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ?`,
      [user_id],
    );
    res.json({ success: true, data: cartItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [POST] /api/cart/checkout - Xử lý thanh toán và lưu đơn hàng
exports.checkout = async (req, res) => {
  // 1. Lấy một kết nối riêng từ Pool để chạy Transaction
  const connection = await db.getConnection();

  try {
    // Bắt đầu chuỗi giao dịch an toàn
    await connection.beginTransaction();

    const user_id = req.user.id;
    const { fullName, phone, address, paymentMethod } = req.body;

    // Kiểm tra đầu vào cơ bản
    if (!fullName || !phone || !address) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin giao hàng!",
      });
    }

    // 2. Lấy thông tin giỏ hàng kèm theo giá sản phẩm hiện tại
    const [cartItems] = await connection.execute(
      `SELECT c.product_id, c.quantity, p.price 
             FROM cart c 
             JOIN products p ON c.product_id = p.id 
             WHERE c.user_id = ?`,
      [user_id],
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res
        .status(400)
        .json({ success: false, message: "Giỏ hàng đang trống!" });
    }

    // 3. Tính toán tổng tiền của đơn hàng
    const totalPrice = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // 4. Tạo bản ghi vào bảng `orders` (Đơn hàng tổng)
    const [orderResult] = await connection.execute(
      `INSERT INTO orders (user_id, full_name, phone, address, total_price, payment_method) 
             VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, fullName, phone, address, totalPrice, paymentMethod],
    );

    const newOrderId = orderResult.insertId;

    // 5. Lưu từng sản phẩm vào bảng `order_details` (Chi tiết đơn hàng)
    // Việc lưu lại "price" ở đây giúp giá đơn hàng không bị đổi nếu sau này bạn tăng/giảm giá sản phẩm gốc
    for (const item of cartItems) {
      await connection.execute(
        `INSERT INTO order_details (order_id, product_id, quantity, price) 
                 VALUES (?, ?, ?, ?)`,
        [newOrderId, item.product_id, item.quantity, item.price],
      );
    }

    // 6. Xóa các sản phẩm đã thanh toán khỏi giỏ hàng
    await connection.execute("DELETE FROM cart WHERE user_id = ?", [user_id]);

    // 7. Hoàn tất chuỗi giao dịch và lưu vĩnh viễn vào Database
    await connection.commit();

    res.status(201).json({
      success: true,
      message: "Đặt hàng thành công!",
      orderId: newOrderId,
    });
  } catch (error) {
    // Nếu có bất kỳ lỗi gì xảy ra, hủy bỏ toàn bộ các lệnh INSERT/DELETE vừa chạy
    await connection.rollback();
    console.error("Lỗi Checkout:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi xử lý đơn hàng." });
  } finally {
    // Luôn luôn trả kết nối lại cho hệ thống (Pool) dù thành công hay thất bại
    connection.release();
  }
};

// [GET] /api/cart/orders - Lấy danh sách đơn hàng của User
exports.getUserOrders = async (req, res) => {
  try {
    const user_id = req.user.id;
    const [orders] = await db.execute(
      "SELECT id, total_price, payment_method, status, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [user_id],
    );
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [GET] /api/cart/orders/:orderId - Lấy chi tiết 1 đơn hàng
exports.getOrderDetails = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { orderId } = req.params;

    // Kiểm tra xem đơn hàng này có đúng là của User này không
    const [orders] = await db.execute(
      "SELECT id FROM orders WHERE id = ? AND user_id = ?",
      [orderId, user_id],
    );
    if (orders.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng" });
    }

    // Lấy danh sách sản phẩm trong đơn hàng
    const [details] = await db.execute(
      `SELECT od.quantity, od.price, p.name, p.image 
                 FROM order_details od 
                 JOIN products p ON od.product_id = p.id 
                 WHERE od.order_id = ?`,
      [orderId],
    );

    res.json({ success: true, data: details });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [PUT] /api/cart/update - Cập nhật số lượng
exports.updateQuantity = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { product_id, quantity } = req.body;

    if (quantity < 1)
      return res.status(400).json({ message: "Số lượng không hợp lệ" });

    await db.execute(
      "UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?",
      [quantity, user_id, product_id],
    );
    res.json({ success: true, message: "Đã cập nhật số lượng" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// [DELETE] /api/cart/remove/:productId - Xóa 1 sản phẩm khỏi giỏ
exports.removeItem = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { productId } = req.params;

    await db.execute("DELETE FROM cart WHERE user_id = ? AND product_id = ?", [
      user_id,
      productId,
    ]);
    res.json({ success: true, message: "Đã xóa sản phẩm" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
