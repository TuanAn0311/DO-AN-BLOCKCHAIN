const db = require("../config/db");
const crypto = require("crypto");

// 1. Thêm công đoạn vào chuỗi cung ứng (Farm -> Processing -> Transport...)
exports.addStage = async (req, res) => {
  try {
    const { product_id, stage, data } = req.body;
    // data là một JSON object chứa nhiệt độ, người phụ trách, thời gian...

    await db.execute(
      "INSERT INTO supply_chain (product_id, stage, data) VALUES (?, ?, ?)",
      [product_id, stage, JSON.stringify(data)],
    );

    res
      .status(201)
      .json({ success: true, message: `Đã cập nhật công đoạn: ${stage}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Tạo mã Hash tổng hợp (Để Frontend mang đi ký MetaMask)
exports.generateHash = async (req, res) => {
  try {
    const { productId } = req.params;

    // Lấy thông tin sản phẩm gốc
    const [products] = await db.execute(
      "SELECT id, name, origin FROM products WHERE id = ?",
      [productId],
    );
    if (products.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy sản phẩm" });

    // Lấy toàn bộ lịch sử chuỗi cung ứng của sản phẩm này
    const [stages] = await db.execute(
      "SELECT stage, data, created_at FROM supply_chain WHERE product_id = ? ORDER BY created_at ASC",
      [productId],
    );

    // Gom tất cả lại thành 1 cục dữ liệu duy nhất
    const dataToHash = JSON.stringify({
      product: products[0],
      history: stages,
    });

    // Băm dữ liệu bằng SHA-256
    const hash =
      "0x" + crypto.createHash("sha256").update(dataToHash).digest("hex");

    res.json({
      success: true,
      message: "Tạo mã Hash thành công",
      productId,
      hash, // Trả mã này cho React gọi Smart Contract
      data_preview: dataToHash,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Lưu lại Transaction Hash sau khi Admin ký MetaMask thành công
exports.saveBlockchainRecord = async (req, res) => {
  try {
    const { product_id, hash, tx_hash } = req.body;

    await db.execute(
      "INSERT INTO blockchain_records (product_id, hash, tx_hash) VALUES (?, ?, ?)",
      [product_id, hash, tx_hash],
    );

    res
      .status(201)
      .json({
        success: true,
        message: "Đã lưu bằng chứng Blockchain vào hệ thống!",
      });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Lấy lịch sử chuỗi cung ứng (để hiển thị trên trang chi tiết sản phẩm)
// [GET] /api/supply-chain/history/:productId
exports.getHistory = async (req, res) => {
        try {
            const { productId } = req.params;
            const [stages] = await db.execute(
                'SELECT stage, data, created_at FROM supply_chain WHERE product_id = ? ORDER BY created_at ASC', 
                [productId]
            );
            res.json({ success: true, data: stages });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    };
