import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const Cart = () => {
  const navigate = useNavigate();
  
  // States cho Dữ liệu
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  
  // States cho Luồng giao diện (1: Giỏ hàng -> 2: Điền Form -> 3: Quét QR / Thành công)
  const [step, setStep] = useState(1);
  
  // States cho Form Giao hàng
  const [shippingInfo, setShippingInfo] = useState({
    fullName: "", phone: "", address: "", paymentMethod: "COD"
  });

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await api.get("/cart");
        setCartItems(res.data.data);
        setTotal(res.data.data.reduce((acc, item) => acc + item.price * item.quantity, 0));
      } catch (error) {
        if (error.response?.status === 401) {
          alert("Vui lòng đăng nhập!"); navigate("/login");
        }
      }
    };
    fetchCart();
  }, [navigate]);

  const handleInputChange = (e) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const submitOrder = async () => {
    try {
      await api.post("/cart/checkout", shippingInfo);
      alert("🎉 Đặt hàng thành công! Cảm ơn bạn đã mua sắm tại DNC Trace.");
      setCartItems([]);
      setTotal(0);
      navigate("/products");
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi thanh toán!");
    }
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault(); // Ngăn load lại trang khi submit form
    if (shippingInfo.paymentMethod === "COD") {
      // Nếu là COD, gọi API chốt đơn luôn
      submitOrder();
    } else {
      // Nếu là chuyển khoản, chuyển sang bước 3 để hiện mã QR
      setStep(3);
    }
  };

 // Hàm xử lý tăng/giảm số lượng
  const handleUpdateQuantity = async (e, productId, currentQty, change) => {
    e.preventDefault();
    e.stopPropagation();
    
    const newQty = currentQty + change;
    if (newQty < 1) return;

    try {
      // 1. Gửi API trước để đảm bảo DB đã nhận
      const res = await api.put("/cart/update", { 
        product_id: productId, // Đảm bảo đây là ID của sản phẩm trong MySQL
        quantity: newQty 
      });

      if (res.data.success) {
        // 2. Nếu DB OK thì mới cập nhật giao diện
        const updatedCart = cartItems.map(item => 
          (item.product_id) === productId ? { ...item, quantity: newQty } : item
        );
        setCartItems(updatedCart);
        setTotal(updatedCart.reduce((acc, item) => acc + item.price * item.quantity, 0));
      }
    } catch (error) {
      console.error("Lỗi cập nhật:", error);
      alert("Không thể cập nhật số lượng vào Database!");
    }
  };

  // Hàm xử lý xóa sản phẩm
  const handleRemoveItem = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?")) return;

    try {
      await api.delete(`/cart/remove/${productId}`);
      
      const updatedCart = cartItems.filter(item => (item.product_id) !== productId);
      setCartItems(updatedCart);
      setTotal(updatedCart.reduce((acc, item) => acc + item.price * item.quantity, 0));
    } catch (error) {
      alert("Lỗi khi xóa sản phẩm!");
    }
  };

  // CẤU HÌNH VIETQR (Thay thông tin của bạn vào đây)
  const bankID = "MB"; // Tên viết tắt: VCB, CTG, TCB, MB, ACB, BIDV...
  const accountNo = "0383614235"; // Số tài khoản của bạn
  const accountName = "DOAN QUANG TUAN AN"; // Tên chủ tài khoản không dấu
  const description = `DNC Thanh toan don hang ${Math.floor(Math.random() * 10000)}`; // Nội dung CK ngẫu nhiên
  const qrUrl = `https://img.vietqr.io/image/${bankID}-${accountNo}-compact2.png?amount=${total}&addInfo=${encodeURIComponent(description)}&accountName=${encodeURIComponent(accountName)}`;

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", fontFamily: "sans-serif" }}>
      {/* BƯỚC 1: XEM GIỎ HÀNG */}
      {step === 1 && (
        <>
          <h2>🛒 Giỏ hàng của bạn</h2>
          {cartItems.length === 0 ? (
            <p>Chưa có sản phẩm nào trong giỏ.</p>
          ) : (
            <div>
              {cartItems.map((item) => (
                <div key={item.product_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", borderBottom: "1px solid #ddd" }}>
                  
                  {/* Cột 1: Ảnh và Tên */}
                  <div style={{ display: "flex", alignItems: "center", gap: "15px", flex: 2 }}>
                    <img src={item.image || "https://via.placeholder.com/80"} alt={item.name} style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "5px" }} />
                    <div>
                      <h4 style={{ margin: "0 0 5px 0" }}>{item.name}</h4>
                      <p style={{ margin: 0, color: "#555" }}>{Number(item.price).toLocaleString()} VNĐ</p>
                    </div>
                  </div>

                  {/* Cột 2: Cụm Tăng/Giảm số lượng */}
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #ccc", borderRadius: "5px", overflow: "hidden", marginRight: "20px" }}>
                    <button 
                      onClick={(e) => handleUpdateQuantity(e, item.product_id , item.quantity, -1)} 
                      style={{ padding: "8px 12px", background: "#f8f9fa", border: "none", cursor: "pointer", borderRight: "1px solid #ccc" }}
                    >−</button>
                    <input 
                      type="number" 
                      value={item.quantity} 
                      readOnly 
                      style={{ width: "40px", textAlign: "center", border: "none", outline: "none", fontWeight: "bold" }} 
                    />
                    <button 
                      onClick={(e) => handleUpdateQuantity(e, item.product_id, item.quantity, 1)} 
                      style={{ padding: "8px 12px", background: "#f8f9fa", border: "none", cursor: "pointer", borderLeft: "1px solid #ccc" }}
                    >+</button>
                  </div>

                  {/* Cột 3: Tổng tiền của món đó + Nút Xóa */}
                  <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1, justifyContent: "flex-end" }}>
                    <div style={{ color: "#d9534f", fontWeight: "bold", fontSize: "16px" }}>
                      {(item.price * item.quantity).toLocaleString()} VNĐ
                    </div>
                    <button 
                      onClick={(e) => handleRemoveItem(e, item.product_id || item.id)} 
                      title="Xóa khỏi giỏ"
                      style={{ background: "transparent", border: "none", color: "#dc3545", cursor: "pointer", fontSize: "20px", padding: "5px", transition: "transform 0.2s" }}
                    >
                      🗑️
                    </button>
                  </div>

                </div>
              ))}
              <div style={{ marginTop: "20px", textAlign: "right" }}>
                <h3 style={{ margin: "0 0 15px 0" }}>Tổng tiền: <span style={{ color: "#d9534f" }}>{total.toLocaleString()} VNĐ</span></h3>
                <button onClick={() => setStep(2)} style={{ padding: "15px 30px", background: "#007bff", color: "white", border: "none", borderRadius: "5px", fontSize: "18px", cursor: "pointer" }}>
                  Tiến hành đặt hàng ➔
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* BƯỚC 2: FORM THÔNG TIN & CHỌN PHƯƠNG THỨC */}
      {step === 2 && (
        <form onSubmit={handleProceedToPayment} style={{ background: "#f9f9f9", padding: "30px", borderRadius: "8px", border: "1px solid #ddd" }}>
          <h2>Thông tin giao hàng</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "30px" }}>
            <input type="text" name="fullName" placeholder="Họ và tên người nhận" required value={shippingInfo.fullName} onChange={handleInputChange} style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc" }} />
            <input type="tel" name="phone" placeholder="Số điện thoại" required value={shippingInfo.phone} onChange={handleInputChange} style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc" }} />
            <textarea name="address" placeholder="Địa chỉ giao hàng chi tiết" required value={shippingInfo.address} onChange={handleInputChange} style={{ padding: "12px", borderRadius: "5px", border: "1px solid #ccc", height: "80px" }} />
          </div>

          <h2>Phương thức thanh toán</h2>
          <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "15px", border: "1px solid #ddd", borderRadius: "8px", flex: 1, background: shippingInfo.paymentMethod === "COD" ? "#e9ecef" : "white" }}>
              <input type="radio" name="paymentMethod" value="COD" checked={shippingInfo.paymentMethod === "COD"} onChange={handleInputChange} />
              📦 Thanh toán khi nhận hàng (COD)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", padding: "15px", border: "1px solid #ddd", borderRadius: "8px", flex: 1, background: shippingInfo.paymentMethod === "QR" ? "#e9ecef" : "white" }}>
              <input type="radio" name="paymentMethod" value="QR" checked={shippingInfo.paymentMethod === "QR"} onChange={handleInputChange} />
              📱 Chuyển khoản qua mã QR
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>Cần thanh toán: <span style={{ color: "#d9534f" }}>{total.toLocaleString()} VNĐ</span></h3>
            <button type="submit" style={{ padding: "15px 30px", background: "#28a745", color: "white", border: "none", borderRadius: "5px", fontSize: "16px", cursor: "pointer", fontWeight: "bold" }}>
              Xác nhận & {shippingInfo.paymentMethod === "COD" ? "Đặt hàng" : "Thanh toán"}
            </button>
          </div>
        </form>
      )}

      {/* BƯỚC 3: HIỂN THỊ MÃ QR NGÂN HÀNG (Nếu chọn chuyển khoản) */}
      {step === 3 && (
        <div style={{ textAlign: "center", background: "#f9f9f9", padding: "40px 20px", borderRadius: "8px", border: "1px solid #ddd" }}>
          <h2>Quét mã QR để thanh toán</h2>
          <p style={{ color: "#555", marginBottom: "20px" }}>Sử dụng ứng dụng ngân hàng (Momo, VNPay, hoặc bất kỳ App Ngân hàng nào) để quét mã.</p>
          
          <div style={{ display: "inline-block", background: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
            <img src={qrUrl} alt="VietQR" style={{ width: "300px", height: "300px" }} />
          </div>

          <div style={{ marginTop: "20px", fontSize: "16px", lineHeight: "1.6" }}>
            <p><strong>Ngân hàng:</strong> {bankID}</p>
            <p><strong>Chủ tài khoản:</strong> {accountName}</p>
            <p><strong>Số tiền cần chuyển:</strong> <span style={{ color: "#d9534f", fontWeight: "bold", fontSize: "20px" }}>{total.toLocaleString()} VNĐ</span></p>
            <p><strong>Nội dung:</strong> <code>{description}</code></p>
          </div>

          <button onClick={submitOrder} style={{ marginTop: "30px", padding: "15px 40px", background: "#28a745", color: "white", border: "none", borderRadius: "5px", fontSize: "18px", cursor: "pointer", fontWeight: "bold" }}>
            Tôi đã chuyển khoản thành công ✅
          </button>
        </div>
      )}
    </div>
  );
};

export default Cart;