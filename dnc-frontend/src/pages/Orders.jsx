import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  // States cho Popup Đánh giá
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewData, setReviewData] = useState({ productId: null, productName: "", rating: 5, comment: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleConfirm = async (orderId, e) => {
    e.stopPropagation(); 
    if (!window.confirm("Bạn xác nhận đã nhận được kiện hàng này?")) return;
    try {
      await api.put(`/orders/user/confirm-received/${orderId}`);
      alert("Cảm ơn bạn đã mua hàng!");
      fetchOrders(); 
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi xác nhận!");
    }
  };

  // Mở popup đánh giá
  const openReviewModal = (item) => {
    // Quét nhiều trường hợp tên biến ID từ API trả về
    const actualProductId = item.product_id || item.productId || item.id;

    if (!actualProductId) {
      return alert("Lỗi: Không tìm thấy mã sản phẩm để đánh giá!");
    }

    setReviewData({ 
      productId: actualProductId, 
      productName: item.name, 
      rating: 5, 
      comment: "" 
    });
    setShowReviewModal(true);
  };

  // Gửi đánh giá lên API
  const submitReview = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/reviews", {
        product_id: reviewData.productId,
        rating: reviewData.rating,
        comment: reviewData.comment
      });
      alert("Đánh giá thành công! Cảm ơn phản hồi của bạn.");
      setShowReviewModal(false);
    } catch (error) {
      alert(error.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá!");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <span style={{ padding: "5px 10px", borderRadius: "15px", background: s.color, color: "white", fontSize: "12px", fontWeight: "bold" }}>
        {s.text}
      </span>
    );
  };

  return (
    <div style={{ maxWidth: "900px", margin: "40px auto", fontFamily: "sans-serif", padding: "0 20px" }}>
      <h2>📦 Lịch sử Đơn hàng của bạn</h2>

      {orders.length === 0 ? (
        <p style={{ color: "#888" }}>Bạn chưa có đơn hàng nào.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
          {orders.map((order) => (
            <div key={order.id} style={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden", background: "#fff" }}>
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", background: "#f8f9fa", cursor: "pointer" }}
                onClick={() => viewDetails(order.id)}
              >
                <div>
                  <h3 style={{ margin: "0 0 5px 0" }}>Đơn hàng #{order.id}</h3>
                  <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
                    {new Date(order.created_at).toLocaleString("vi-VN")} | {order.payment_method === 'QR' ? 'VietQR' : 'Tiền mặt (COD)'}
                  </p>
                  
                  {order.status === 'shipped' && (
                    <button
                      onClick={(e) => handleConfirm(order.id, e)}
                      style={{ marginTop: "10px", padding: "8px 15px", background: "#28a745", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}
                    >
                      ✓ Đã nhận được hàng
                    </button>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#d9534f" }}>
                    {Number(order.total_price).toLocaleString()} VNĐ
                  </div>
                  {getStatusDisplay(order.status)}
                  <div style={{ color: "#007bff", width: "80px", textAlign: "right" }}>
                    {selectedOrderDetails?.orderId === order.id ? "▲ Đóng" : "▼ Chi tiết"}
                  </div>
                </div>
              </div>

              {selectedOrderDetails?.orderId === order.id && (
                <div style={{ padding: "20px", borderTop: "1px solid #ddd", background: "white" }}>
                  <h4 style={{ marginTop: 0 }}>Sản phẩm đã mua:</h4>
                  {selectedOrderDetails.items.map((item, index) => (
                    <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px", paddingBottom: "15px", borderBottom: "1px dashed #eee" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
                        <img src={item.image || "https://via.placeholder.com/60"} alt={item.name} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "5px" }} />
                        <div>
                          <strong style={{ display: "block", marginBottom: "5px" }}>{item.name}</strong>
                          <span style={{ color: "#666" }}>{Number(item.price).toLocaleString()} VNĐ x {item.quantity}</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div style={{ fontWeight: "bold" }}>{(item.price * item.quantity).toLocaleString()} VNĐ</div>
                        
                        {/* HIỆN NÚT ĐÁNH GIÁ NẾU ĐƠN HÀNG ĐÃ GIAO THÀNH CÔNG */}
                        {order.status === 'delivered' && (
                          <button 
                            onClick={() => openReviewModal(item)}
                            style={{ padding: '5px 12px', background: '#ffc107', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                          >
                            ⭐ Đánh giá
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL ĐÁNH GIÁ SẢN PHẨM */}
      {/* ======================================================== */}
      {showReviewModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: '450px', borderRadius: '8px', padding: '25px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
            <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Đánh giá sản phẩm</h3>
            <p style={{ fontWeight: 'bold', color: '#007bff', marginBottom: '15px' }}>{reviewData.productName}</p>
            
            <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Chất lượng sản phẩm:</label>
                <div style={{ display: 'flex', gap: '10px', fontSize: '24px', cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <span 
                      key={star} 
                      onClick={() => setReviewData({...reviewData, rating: star})}
                      style={{ color: star <= reviewData.rating ? '#ffc107' : '#e4e5e9', transition: 'color 0.2s' }}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                  {reviewData.rating} / 5 Sao
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Nhận xét của bạn:</label>
                <textarea 
                  required 
                  rows="4" 
                  placeholder="Hãy chia sẻ cảm nhận của bạn về sản phẩm này nhé..."
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({...reviewData, comment: e.target.value})}
                  style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowReviewModal(false)} style={{ padding: '10px 15px', background: '#f1f1f1', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Hủy
                </button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: isSubmitting ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
                  {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;