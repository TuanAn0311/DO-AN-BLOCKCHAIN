import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get("/cart/orders");
        setOrders(res.data.data);
      } catch (error) {
        if (error.response?.status === 401) {
          alert("Vui lòng đăng nhập!");
          navigate("/login");
        }
      }
    };
    fetchOrders();
  }, [navigate]);

  const viewDetails = async (orderId) => {
    // Nếu đang xem đơn này rồi thì bấm lại sẽ đóng nó (Toggle)
    if (selectedOrderDetails?.orderId === orderId) {
      return setSelectedOrderDetails(null);
    }

    try {
      const res = await api.get(`/cart/orders/${orderId}`);
      setSelectedOrderDetails({ orderId, items: res.data.data });
    } catch (error) {
      alert("Lỗi khi tải chi tiết đơn hàng");
    }
  };

  // Hàm chuyển đổi status thành tiếng Việt và màu sắc
  const getStatusDisplay = (status) => {
    const statusMap = {
      pending: { text: "Chờ xử lý", color: "#f0ad4e" },
      processing: { text: "Đang đóng gói", color: "#17a2b8" },
      shipped: { text: "Đang giao hàng", color: "#007bff" },
      delivered: { text: "Đã giao", color: "#28a745" },
      cancelled: { text: "Đã hủy", color: "#dc3545" },
    };
    const s = statusMap[status] || statusMap.pending;
    return (
      <span
        style={{
          padding: "5px 10px",
          borderRadius: "15px",
          background: s.color,
          color: "white",
          fontSize: "12px",
          fontWeight: "bold",
        }}
      >
        {s.text}
      </span>
    );
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        fontFamily: "sans-serif",
      }}
    >
      <h2>📦 Lịch sử Đơn hàng của bạn</h2>

      {orders.length === 0 ? (
        <p style={{ color: "#888" }}>Bạn chưa có đơn hàng nào.</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "15px",
            marginTop: "20px",
          }}
        >
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              {/* Phần thông tin tóm tắt đơn hàng */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "20px",
                  background: "#f8f9fa",
                  cursor: "pointer",
                }}
                onClick={() => viewDetails(order.id)}
              >
                <div>
                  <h3 style={{ margin: "0 0 5px 0" }}>Đơn hàng #{order.id}</h3>
                  <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                    {new Date(order.created_at).toLocaleString("vi-VN")} |{" "}
                    {order.payment_method}
                  </p>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "20px" }}
                >
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "bold",
                      color: "#d9534f",
                    }}
                  >
                    {Number(order.total_price).toLocaleString()} VNĐ
                  </div>
                  {getStatusDisplay(order.status)}
                  <div style={{ color: "#007bff" }}>
                    {selectedOrderDetails?.orderId === order.id
                      ? "▲ Đóng"
                      : "▼ Chi tiết"}
                  </div>
                </div>
              </div>

              {/* Phần chi tiết sổ ra */}
              {selectedOrderDetails?.orderId === order.id && (
                <div
                  style={{
                    padding: "20px",
                    borderTop: "1px solid #ddd",
                    background: "white",
                  }}
                >
                  <h4 style={{ marginTop: 0 }}>Sản phẩm đã mua:</h4>
                  {selectedOrderDetails.items.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "15px",
                        paddingBottom: "15px",
                        borderBottom: "1px dashed #eee",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "15px",
                        }}
                      >
                        <img
                          src={item.image || "https://via.placeholder.com/60"}
                          alt={item.name}
                          style={{
                            width: "60px",
                            height: "60px",
                            objectFit: "cover",
                            borderRadius: "5px",
                          }}
                        />
                        <div>
                          <strong
                            style={{ display: "block", marginBottom: "5px" }}
                          >
                            {item.name}
                          </strong>
                          <span style={{ color: "#666" }}>
                            {Number(item.price).toLocaleString()} VNĐ x{" "}
                            {item.quantity}
                          </span>
                        </div>
                      </div>
                      <div style={{ fontWeight: "bold" }}>
                        {(item.price * item.quantity).toLocaleString()} VNĐ
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;
