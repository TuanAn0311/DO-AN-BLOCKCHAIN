// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const authRoutes = require("./routes/authRoutes");
const supplyChainRoutes = require("./routes/supplyChainRoutes");
const addressRoutes = require("./routes/addressRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require('./routes/reviewRoutes');
//Express app để tạo server và định nghĩa các route API
const app = express();

// Middlewares
app.use(cors({
    origin: '*', // Cho phép mọi Frontend gọi tới (có thể đổi thành 'http://localhost:5173' để bảo mật hơn)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Cho phép các phương thức
    allowedHeaders: ['Content-Type', 'Authorization'] // QUAN TRỌNG: Cho phép Frontend gửi Header Authorization
}));app.use(express.json()); // Đọc data dạng JSON từ request body
app.use(express.urlencoded({ extended: true }));
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/supply-chain", supplyChainRoutes);
app.use("/api/addresses", addressRoutes); // Thêm route cho địa chỉ
app.use("/api/orders", orderRoutes); // Thêm route cho đơn hàng
app.use('/api/reviews', reviewRoutes);
// Import Database (kích hoạt test kết nối)
const db = require("./config/db");



// Test Route
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "DNC-Trace Backend is running!" });
});

// Chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});
