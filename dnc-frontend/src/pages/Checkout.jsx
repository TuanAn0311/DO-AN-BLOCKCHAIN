import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Checkout = () => {
    const navigate = useNavigate();
    
    // 1. STATE QUẢN LÝ DỮ LIỆU
    const [cartItems, setCartItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('COD'); // COD hoặc QR
    
    // State Địa chỉ
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    
    // State Modal (Popup)
    const [showModal, setShowModal] = useState(false);
    const [isAddingNew, setIsAddingNew] = useState(false); // Đang ở chế độ chọn hay thêm mới
    const [newAddress, setNewAddress] = useState({ full_name: '', phone: '', address_line: '', city: '', district: '', is_default: 1 });

    //State cho VietQR (Giai đoạn 4 sẽ dùng)
    const [showQR, setShowQR] = useState(false);

    //Thông tin thanh toán của ông chủ Tuấn An Đẳng cấp
    const BANK_ID = "MB";
    const ACCOUNT_NO = "0383614235";
    const ACCOUNT_NAME = "DOAN QUANG TUAN AN";

    // 2. FETCH DỮ LIỆU (Giỏ hàng & Địa chỉ)
    useEffect(() => {
        const fetchCheckoutData = async () => {
            try {
                // A. Lấy giỏ hàng (Bạn hãy điều chỉnh API /cart này khớp với code cũ của bạn nhé)
                const resCart = await api.get('/cart'); 
                const items = resCart.data.data || [];
                setCartItems(items);
                
                // Tính tổng tiền
                const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                setTotalPrice(total);

                // B. Lấy danh sách địa chỉ
                fetchAddresses();
            } catch (error) {
                console.error("Lỗi tải dữ liệu thanh toán:", error);
            }
        };
        fetchCheckoutData();
    }, []);

    const fetchAddresses = async () => {
        try {
            const res = await api.get('/addresses');
            const addrList = res.data.data || [];
            setAddresses(addrList);
            // Mặc định chọn địa chỉ đầu tiên (vì Backend đã order theo is_default DESC)
            if (addrList.length > 0 && !selectedAddress) {
                setSelectedAddress(addrList[0]);
            }
        } catch (error) {
            console.error("Lỗi lấy địa chỉ:", error);
        }
    };

    // 3. XỬ LÝ THÊM ĐỊA CHỈ MỚI TRONG MODAL
    const handleAddNewAddress = async (e) => {
        e.preventDefault();
        try {
            await api.post('/addresses', newAddress);
            alert("Đã thêm địa chỉ mới!");
            setIsAddingNew(false); // Quay lại danh sách địa chỉ
            setNewAddress({ full_name: '', phone: '', address_line: '', city: '', district: '', is_default: 1 }); // Reset form
            fetchAddresses(); // Tải lại danh sách, nó sẽ tự chọn cái vừa thêm (nếu là default)
        } catch (error) {
            alert("Lỗi khi thêm địa chỉ!");
        }
    };

    // 4. XỬ LÝ NÚT THANH TOÁN
    const handlePlaceOrder = async () => {
        if (!selectedAddress) return alert("Vui lòng thêm địa chỉ giao hàng!");
        if (cartItems.length === 0) return alert("Giỏ hàng của bạn đang trống!");

        if (paymentMethod === 'QR') {
            // Mở Popup quét QR
            setShowQR(true);
        } else {
            // Nếu là COD, tiến hành đặt hàng luôn
            submitOrder('COD');
        }
    };

    // Hàm gọi API đặt hàng thực sự (Dùng chung cho cả COD và khi xác nhận QR xong)
    const submitOrder = async (method) => {
        try {
            const res = await api.post('/orders/checkout', {
                address_id: selectedAddress.id,
                payment_method: method
            });
            
            alert(`🎉 Đặt hàng thành công! Vui lòng kiểm tra Email của bạn.`);
            window.dispatchEvent(new Event("cartUpdate")); 
            navigate('/orders'); 
        } catch (error) {
            alert(error.response?.data?.message || "Có lỗi xảy ra khi đặt hàng!");
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
            <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Thanh toán đơn hàng</h2>

            {/* PHẦN 1: ĐỊA CHỈ GIAO HÀNG */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px', borderTop: '4px solid #007bff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: '#d9534f' }}>📍 Địa chỉ nhận hàng</h3>
                    <button onClick={() => setShowModal(true)} style={{ padding: '8px 15px', cursor: 'pointer', background: 'none', border: '1px solid #007bff', color: '#007bff', borderRadius: '4px', fontWeight: 'bold' }}>
                        Thay đổi
                    </button>
                </div>
                
                <div style={{ marginTop: '15px', fontSize: '16px' }}>
                    {selectedAddress ? (
                        <>
                            <strong>{selectedAddress.full_name}</strong> - <strong>{selectedAddress.phone}</strong>
                            <span style={{ marginLeft: '15px', color: '#555' }}>
                                {selectedAddress.address_line}, {selectedAddress.district}, {selectedAddress.city}
                            </span>
                            {selectedAddress.is_default === 1 && (
                                <span style={{ marginLeft: '10px', fontSize: '12px', background: '#28a745', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>Mặc định</span>
                            )}
                        </>
                    ) : (
                        <p style={{ color: '#dc3545', fontStyle: 'italic' }}>Bạn chưa có địa chỉ giao hàng nào. Vui lòng thêm địa chỉ!</p>
                    )}
                </div>
            </div>

            {/* PHẦN 2: DANH SÁCH SẢN PHẨM */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0 }}>🛒 Sản phẩm đã chọn</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ color: '#666', borderBottom: '1px solid #eee' }}>
                            <th style={{ padding: '10px 0' }}>Sản phẩm</th>
                            <th>Đơn giá</th>
                            <th>Số lượng</th>
                            <th style={{ textAlign: 'right' }}>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cartItems.map((item, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src={item.image || "https://via.placeholder.com/50"} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '5px' }} />
                                    <span>{item.name}</span>
                                </td>
                                <td>{Number(item.price).toLocaleString()}đ</td>
                                <td>{item.quantity}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#d9534f' }}>
                                    {Number(item.price * item.quantity).toLocaleString()}đ
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* PHẦN 3: PHƯƠNG THỨC THANH TOÁN */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0 }}>💳 Phương thức thanh toán</h3>
                <div style={{ display: 'flex', gap: '20px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 20px', border: paymentMethod === 'COD' ? '2px solid #28a745' : '1px solid #ccc', borderRadius: '5px' }}>
                        <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} />
                        Thanh toán khi nhận hàng (COD)
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 20px', border: paymentMethod === 'QR' ? '2px solid #28a745' : '1px solid #ccc', borderRadius: '5px' }}>
                        <input type="radio" name="payment" value="QR" checked={paymentMethod === 'QR'} onChange={(e) => setPaymentMethod(e.target.value)} />
                        Thanh toán qua mã VietQR
                    </label>
                </div>
            </div>

            {/* PHẦN 4: TỔNG TIỀN VÀ ĐẶT HÀNG */}
            <div style={{ background: '#fdfbf7', padding: '30px', borderRadius: '8px', border: '1px dashed #d9534f', textAlign: 'right' }}>
                <div style={{ fontSize: '18px', marginBottom: '15px' }}>
                    Tổng tiền hàng: <strong style={{ fontSize: '24px', color: '#d9534f' }}>{totalPrice.toLocaleString()} VNĐ</strong>
                </div>
                <button 
                    onClick={handlePlaceOrder}
                    style={{ padding: '15px 40px', fontSize: '18px', fontWeight: 'bold', background: '#d9534f', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                >
                    TIẾN HÀNH ĐẶT HÀNG
                </button>
            </div>

            {/* ======================================================== */}
            {/* MODAL (POPUP) CHỌN VÀ THÊM ĐỊA CHỈ */}
            {/* ======================================================== */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', width: '500px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                        
                        {/* Header Modal */}
                        <div style={{ padding: '15px 20px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>{isAddingNew ? "Thêm địa chỉ mới" : "Địa chỉ của tôi"}</h3>
                            <button onClick={() => { setShowModal(false); setIsAddingNew(false); }} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
                        </div>

                        {/* Body Modal */}
                        <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                            {!isAddingNew ? (
                                /* Chế độ: DANH SÁCH ĐỊA CHỈ */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {addresses.map(addr => (
                                        <div key={addr.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', paddingBottom: '15px', borderBottom: '1px solid #eee' }}>
                                            <input 
                                                type="radio" 
                                                checked={selectedAddress?.id === addr.id} 
                                                onChange={() => setSelectedAddress(addr)}
                                                style={{ marginTop: '5px', cursor: 'pointer' }}
                                            />
                                            <div>
                                                <div style={{ marginBottom: '5px' }}>
                                                    <strong>{addr.full_name}</strong> | <span style={{ color: '#666' }}>{addr.phone}</span>
                                                </div>
                                                <div style={{ color: '#555', fontSize: '14px' }}>
                                                    {addr.address_line}<br/>{addr.district}, {addr.city}
                                                </div>
                                                {addr.is_default === 1 && <span style={{ fontSize: '12px', color: '#d9534f', border: '1px solid #d9534f', padding: '2px 5px', borderRadius: '3px', marginTop: '5px', display: 'inline-block' }}>Mặc định</span>}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <button onClick={() => setIsAddingNew(true)} style={{ width: '100%', padding: '12px', background: 'none', border: '1px dashed #007bff', color: '#007bff', cursor: 'pointer', borderRadius: '5px', fontWeight: 'bold' }}>
                                        + Thêm Địa Chỉ Mới
                                    </button>
                                </div>
                            ) : (
                                /* Chế độ: FORM THÊM ĐỊA CHỈ MỚI */
                                <form onSubmit={handleAddNewAddress} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input required placeholder="Họ và tên" value={newAddress.full_name} onChange={e => setNewAddress({...newAddress, full_name: e.target.value})} style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                        <input required placeholder="Số điện thoại" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                    </div>
                                    <input required placeholder="Địa chỉ cụ thể (Số nhà, tên đường...)" value={newAddress.address_line} onChange={e => setNewAddress({...newAddress, address_line: e.target.value})} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input required placeholder="Quận / Huyện" value={newAddress.district} onChange={e => setNewAddress({...newAddress, district: e.target.value})} style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                        <input required placeholder="Tỉnh / Thành phố" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                        <button type="button" onClick={() => setIsAddingNew(false)} style={{ padding: '10px 20px', background: '#f1f1f1', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Trở lại</button>
                                        <button type="submit" style={{ padding: '10px 20px', background: '#d9534f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hoàn thành</button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Footer Modal (Chỉ hiện khi ở danh sách chọn) */}
                        {!isAddingNew && (
                            <div style={{ padding: '15px 20px', background: '#f9f9f9', borderTop: '1px solid #ddd', textAlign: 'right' }}>
                                <button onClick={() => setShowModal(false)} style={{ padding: '10px 20px', background: '#d9534f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    Xác nhận
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ======================================================== */}
            {/* MODAL THANH TOÁN VIETQR */}
            {/* ======================================================== */}
            {showQR && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ background: '#fff', width: '400px', borderRadius: '8px', padding: '25px', textAlign: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#0056b3' }}>Quét mã để thanh toán</h3>
                        <p style={{ color: '#555', marginBottom: '20px' }}>Sử dụng App ngân hàng để quét mã. Số tiền và nội dung sẽ được điền tự động.</p>
                        
                        {/* API VietQR tự động tạo ảnh */}
                        <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '10px', display: 'inline-block' }}>
                            <img 
                                src={`https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${totalPrice}&addInfo=Thanh toan don hang DNC&accountName=${ACCOUNT_NAME}`} 
                                alt="VietQR" 
                                style={{ width: '250px', height: '250px', objectFit: 'contain' }}
                            />
                        </div>

                        <div style={{ marginTop: '20px', fontSize: '18px' }}>
                            Tổng tiền: <strong style={{ color: '#d9534f' }}>{totalPrice.toLocaleString()} VNĐ</strong>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                            <button onClick={() => setShowQR(false)} style={{ flex: 1, padding: '12px', background: '#f1f1f1', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                                Hủy bỏ
                            </button>
                            <button 
                                onClick={() => { setShowQR(false); submitOrder('QR'); }} 
                                style={{ flex: 1, padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Tôi đã chuyển khoản
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Checkout;