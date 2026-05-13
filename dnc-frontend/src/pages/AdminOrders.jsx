import { useEffect, useState } from 'react';
import api from '../services/api';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState([]);
    const [showModal, setShowModal] = useState(false);

    // 1. Lấy danh sách toàn bộ đơn hàng
    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders/admin/all');
            setOrders(res.data.data || []);
        } catch (error) {
            console.error("Lỗi lấy danh sách đơn hàng:", error);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // 2. Đổi trạng thái đơn hàng
    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await api.put(`/orders/admin/${orderId}/status`, { status: newStatus });
            alert("Đã cập nhật trạng thái đơn hàng!");
            fetchOrders(); // Tải lại bảng
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái:", error);
            alert("Lỗi cập nhật trạng thái!");
        }
    };

    // 3. Xem chi tiết đơn hàng
    const handleViewDetails = async (order) => {
        try {
            const res = await api.get(`/orders/admin/${order.id}`);
            setOrderDetails(res.data.data || []);
            setSelectedOrder(order);
            setShowModal(true);
        } catch (error) {
            console.error("Lỗi lấy chi tiết đơn hàng:", error);
            alert("Lỗi lấy chi tiết đơn hàng!");
        }
    };

    // Hàm render màu sắc trạng thái cho đẹp
    const getStatusBadge = (status) => {
        switch (status) {
            case 'pending': return <span style={{ background: '#ffc107', color: '#000', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>Chờ xử lý</span>;
            case 'processing': return <span style={{ background: '#17a2b8', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>Đang chuẩn bị</span>;
            case 'shipped': return <span style={{ background: '#007bff', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>Đang giao</span>;
            case 'delivered': return <span style={{ background: '#28a745', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>Đã nhận</span>;
            case 'cancelled': return <span style={{ background: '#dc3545', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>Đã hủy</span>;
            default: return status;
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
            <h2>📋 Quản lý Đơn hàng (Admin)</h2>

            {/* BẢNG DANH SÁCH ĐƠN HÀNG */}
            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '8px', border: '1px solid #ddd', marginTop: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8f9fa' }}>
                        <tr>
                            <th style={{ padding: '15px', borderBottom: '2px solid #ddd' }}>Mã ĐH</th>
                            <th style={{ padding: '15px', borderBottom: '2px solid #ddd' }}>Khách hàng</th>
                            <th style={{ padding: '15px', borderBottom: '2px solid #ddd' }}>Tổng tiền</th>
                            <th style={{ padding: '15px', borderBottom: '2px solid #ddd' }}>Thanh toán</th>
                            <th style={{ padding: '15px', borderBottom: '2px solid #ddd' }}>Trạng thái</th>
                            <th style={{ padding: '15px', borderBottom: '2px solid #ddd' }}>Cập nhật</th>
                            <th style={{ padding: '15px', borderBottom: '2px solid #ddd', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px', fontWeight: 'bold' }}>#{order.id}</td>
                                <td style={{ padding: '15px' }}>
                                    <div>{order.full_name}</div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>{order.phone}</div>
                                </td>
                                <td style={{ padding: '15px', color: '#d9534f', fontWeight: 'bold' }}>{Number(order.total_price).toLocaleString()}đ</td>
                                <td style={{ padding: '15px' }}>
                                    {order.payment_method === 'QR' ? '💳 VietQR' : '💵 Tiền mặt (COD)'}
                                </td>
                                <td style={{ padding: '15px' }}>{getStatusBadge(order.status)}</td>
                                
                                {/* Cột Cập nhật trạng thái */}
                                <td style={{ padding: '15px' }}>
                                    <select 
                                        value={order.status} 
                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                                    >
                                        <option value="pending">Chờ xử lý</option>
                                        <option value="processing">Đang chuẩn bị</option>
                                        <option value="shipped">Đang giao hàng</option>
                                        <option value="delivered">Đã giao thành công</option>
                                        <option value="cancelled">Hủy đơn</option>
                                    </select>
                                </td>

                                <td style={{ padding: '15px', textAlign: 'center' }}>
                                    <button 
                                        onClick={() => handleViewDetails(order)} 
                                        style={{ background: '#007bff', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        Chi tiết
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {orders.length === 0 && (
                            <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Chưa có đơn hàng nào!</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ======================================================== */}
            {/* MODAL CHI TIẾT ĐƠN HÀNG */}
            {/* ======================================================== */}
            {showModal && selectedOrder && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ background: '#fff', width: '600px', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                        
                        <div style={{ padding: '15px 20px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8f9fa' }}>
                            <h3 style={{ margin: 0 }}>Chi tiết đơn hàng #{selectedOrder.id}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
                        </div>

                        <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                            <div style={{ marginBottom: '15px', padding: '15px', background: '#e9ecef', borderRadius: '5px' }}>
                                <p style={{ margin: '0 0 8px 0' }}><strong>Khách hàng:</strong> {selectedOrder.full_name} - {selectedOrder.phone}</p>
                                <p style={{ margin: 0 }}><strong>Địa chỉ giao:</strong> {selectedOrder.address}</p>
                            </div>

                            <h4 style={{ borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Sản phẩm đã mua:</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {orderDetails.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', paddingBottom: '10px', borderBottom: '1px dashed #ddd' }}>
                                        <img src={item.image || "https://via.placeholder.com/50"} alt={item.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                                            <div style={{ fontSize: '13px', color: '#666' }}>Số lượng: {item.quantity} x {Number(item.price).toLocaleString()}đ</div>
                                        </div>
                                        <div style={{ fontWeight: 'bold', color: '#d9534f' }}>
                                            {(item.quantity * item.price).toLocaleString()}đ
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '15px 20px', background: '#f9f9f9', borderTop: '1px solid #ddd', textAlign: 'right', fontSize: '18px' }}>
                            Tổng thanh toán: <strong style={{ color: '#d9534f' }}>{Number(selectedOrder.total_price).toLocaleString()} VNĐ</strong>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminOrders;
