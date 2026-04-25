import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await api.get("/cart");
        setCartItems(res.data.data);

        // Tính toán tổng tiền: (Giá * Số lượng)
        const sum = res.data.data.reduce(
          (acc, item) => acc + item.price * item.quantity,
          0,
        );
        setTotal(sum);
      } catch (error) {
        console.error("Lỗi lấy giỏ hàng:", error);
        if (error.response?.status === 401) {
          alert("Vui lòng đăng nhập!");
          navigate("/login");
        }
      }
    };
    fetchCart();
  }, [navigate]);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return alert("Giỏ hàng đang trống!");

    try {
      await api.post("/cart/checkout");
      alert("🎉 Đặt hàng thành công! Cảm ơn bạn đã mua sắm tại DNC Trace.");
      setCartItems([]); // Làm rỗng UI
      setTotal(0);
      navigate("/products"); // Quay lại trang chủ
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi thanh toán!");
    }
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        fontFamily: "sans-serif",
      }}
    >
      <button
        onClick={() => navigate("/products")}
        style={{ marginBottom: "20px", cursor: "pointer" }}
      >
        ← Tiếp tục mua sắm
      </button>

      <h2>🛒 Giỏ hàng của bạn</h2>

      {cartItems.length === 0 ? (
        <p style={{ color: "#888", marginTop: "20px" }}>
          Chưa có sản phẩm nào trong giỏ.
        </p>
      ) : (
        <div style={{ marginTop: "20px" }}>
          {/* Danh sách sản phẩm */}
          {cartItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "15px",
                borderBottom: "1px solid #ddd",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "15px" }}
              >
                <img
                  src={item.image || "https://via.placeholder.com/80"}
                  alt={item.name}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "5px",
                  }}
                />
                <div>
                  <h4 style={{ margin: "0 0 5px 0" }}>{item.name}</h4>
                  <p style={{ margin: 0, color: "#555" }}>
                    {Number(item.price).toLocaleString()} VNĐ
                  </p>
                </div>
              </div>
              <div style={{ fontWeight: "bold" }}>x {item.quantity}</div>
              <div style={{ color: "#d9534f", fontWeight: "bold" }}>
                {(item.price * item.quantity).toLocaleString()} VNĐ
              </div>
            </div>
          ))}

          {/* Tổng kết và Nút Thanh toán */}
          <div
            style={{
              marginTop: "30px",
              padding: "20px",
              background: "#f8f9fa",
              borderRadius: "8px",
              textAlign: "right",
            }}
          >
            <h3 style={{ margin: "0 0 15px 0" }}>
              Tổng cộng:{" "}
              <span style={{ color: "#d9534f" }}>
                {total.toLocaleString()} VNĐ
              </span>
            </h3>
            <button
              onClick={handleCheckout}
              style={{
                padding: "15px 30px",
                background: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "18px",
                cursor: "pointer",
              }}
            >
              💳 Xác nhận Thanh toán
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
