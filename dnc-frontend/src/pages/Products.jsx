import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Products = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Gọi API lấy danh sách sản phẩm
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Lưu ý: Backend lúc này chỉ trả về những sản phẩm có status = 1 (Đã xuất xưởng)
                const res = await api.get('/products');
                setProducts(res.data.data);
            } catch (error) {
                console.error("Lỗi lấy danh sách sản phẩm:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Hàm thêm vào giỏ hàng
    const addToCart = async (productId) => {
        if (!localStorage.getItem('token')) {
            alert("Vui lòng đăng nhập để mua hàng!");
            navigate('/login');
            return;
        }
        try {
            await api.post('/cart/add', { product_id: productId, quantity: 1 });
            alert("Đã thêm vào giỏ hàng!");
            // Kích hoạt event để Header tự động cập nhật số lượng badge
            window.dispatchEvent(new Event("cartUpdate"));
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi khi thêm giỏ hàng");
        }
    };

    if (isLoading) {
        return <p style={{ textAlign: 'center', marginTop: '50px', fontSize: '18px' }}>⏳ Đang tải danh sách cửa hàng...</p>;
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '40px auto', fontFamily: 'sans-serif', padding: '0 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                <h2 style={{ color: '#333', margin: 0 }}>☕ Danh sách Cà Phê</h2>
            </div>

            {products.length === 0 ? (
                <p style={{ textAlign: 'center', marginTop: '50px', color: '#888' }}>Hiện chưa có sản phẩm nào được bày bán.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '25px', marginTop: '30px' }}>
                    {products.map(product => (
                        <div key={product.id} style={{
                            border: '1px solid #e0e0e0',
                            borderRadius: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            overflow: 'hidden',
                            background: '#fff',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
                            transition: 'transform 0.2s',
                            opacity: product.stock <= 0 ? 0.75 : 1 // Làm mờ nhẹ toàn bộ thẻ nếu hết hàng
                        }}>
                            
                            {/* KHU VỰC CLICK ĐỂ XEM CHI TIẾT */}
                            <div 
                                onClick={() => navigate(`/product/${product.id}`)}
                                style={{ cursor: 'pointer', position: 'relative' }} // Cần relative để chữ "Hết hàng" căn giữa đúng
                            >
                                <img 
                                    src={product.image || "https://via.placeholder.com/250"} 
                                    alt={product.name} 
                                    style={{ 
                                        width: '100%', 
                                        height: '220px', 
                                        objectFit: 'cover',
                                        filter: product.stock <= 0 ? 'grayscale(100%)' : 'none' // Chuyển ảnh thành trắng đen nếu hết hàng
                                    }}
                                />
                                
                                {/* Overlay Hết hàng đè lên ảnh */}
                                {product.stock <= 0 && (
                                    <div style={{
                                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                        background: 'rgba(220, 53, 69, 0.9)', color: 'white', padding: '10px 20px',
                                        fontWeight: 'bold', borderRadius: '5px', zIndex: 2, fontSize: '18px',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)', letterSpacing: '1px'
                                    }}>
                                        HẾT HÀNG
                                    </div>
                                )}

                                <div style={{ padding: '15px' }}>
                                    <h3 style={{ margin: '0 0 10px 0', color: '#222', fontSize: '18px', height: '44px', overflow: 'hidden' }}>
                                        {product.name}
                                    </h3>
                                    <p style={{ color: '#d9534f', fontWeight: 'bold', fontSize: '20px', margin: '0 0 8px 0' }}>
                                        {Number(product.price).toLocaleString()} VNĐ
                                    </p>
                                    <p style={{ fontSize: '14px', color: '#666', margin: '0 0 5px 0' }}>📍 Nguồn gốc: {product.origin}</p>
                                    <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>📦 Còn lại: <strong style={{ color: product.stock > 0 ? '#28a745' : '#dc3545' }}>{product.stock}</strong> SP</p>
                                </div>
                            </div>

                            {/* NÚT CHỨC NĂNG (Thêm vào giỏ) */}
                            <div style={{ padding: '15px', paddingTop: '0' }}>
                                {product.stock > 0 ? (
                                    <button 
                                        onClick={() => addToCart(product.id)} 
                                        style={{ width: '100%', padding: '12px', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', fontSize: '15px' }}
                                    >
                                        🛒 Thêm vào giỏ
                                    </button>
                                ) : (
                                    <button 
                                        disabled 
                                        style={{ width: '100%', padding: '12px', cursor: 'not-allowed', background: '#e9ecef', color: '#6c757d', border: '1px solid #ced4da', borderRadius: '5px', fontWeight: 'bold', fontSize: '15px' }}
                                    >
                                        🚫 Không thể mua
                                    </button>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Products;