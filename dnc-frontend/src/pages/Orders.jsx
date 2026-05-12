import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // Đưa hàm fetchOrders ra ngoài để có thể gọi lại sau khi Xác nhận nhận hàng
  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get("/cart/orders");
      setOrders(res.data.data);
    } catch (error) {
      if (error.response?.status === 401) {
        alert("Vui lòng đăng nhập!");
        navigate("/login");
      }
    }
  }, [navigate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  // Hàm xử lý xác nhận nhận hàng
  const handleConfirm = async (orderId, e) => {
    e.stopPropagation(); // NGĂN CHẶN SỰ KIỆN CLICK LAN RA NGOÀI (Tránh việc xổ chi tiết đơn hàng khi bấm nút)
    
    if (!window.confirm("Bạn xác nhận đã nhận được kiện hàng này?")) return;
    
    try {
      await api.put(`/orders/user/confirm-received/${orderId}`);
      alert("Cảm ơn bạn đã mua hàng!");
      fetchOrders(); // Gọi lại đúng tên hàm fetchOrders để load lại dữ liệu mới
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi xác nhận!");
    }
  };

  // Hàm chuyển đổi status thành tiếng Việt và màu sắc
  const getStatusDisplay = (status) => {
    const statusMap = {
      pending: { text: "Chờ xử lý", color: "#f0ad4e" },
      processing: { text: "Đang đóng gói", color: "#17a2b8" },
      shipped: { text: "Đang giao hàng", color: "#007bff" },
      delivered: { text: "Giao thành công", color: "#28a745" },
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
        padding: "0 20px"
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
                background: "#fff"
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
                    {order.payment_method === 'QR' ? 'VietQR' : 'Tiền mặt (COD)'}
                  </p>
                  
                  {/* NÚT XÁC NHẬN NHẬN HÀNG - CHỈ HIỆN KHI ĐANG GIAO (shipped) */}
                  {order.status === 'shipped' && (
                    <button
                      onClick={(e) => handleConfirm(order.id, e)}
                      style={{
                        marginTop: "10px",
                        padding: "8px 15px",
                        background: "#28a745",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontWeight: "bold",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                      }}
                    >
                      ✓ Đã nhận được hàng
                    </button>
                  )}
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
                  <div style={{ color: "#007bff", width: "80px", textAlign: "right" }}>
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