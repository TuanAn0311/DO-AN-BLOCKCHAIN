// Đây là trang hiển thị danh sách sản phẩm, nơi người dùng có thể xem các sản phẩm cà phê, thêm vào giỏ hàng và truy xuất nguồn gốc
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Products = () => {
    const [products, setProducts] = useState([]);
    const navigate = useNavigate();

    // Lấy dữ liệu ngay khi trang vừa load
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get('/products');
                setProducts(response.data.data);
            } catch (error) {
                console.error("Lỗi lấy sản phẩm:", error);
            }
        };
        fetchProducts();
    }, []);

    const addToCart = async (productId) => {
        // Kiểm tra xem đã đăng nhập chưa
        if (!localStorage.getItem('token')) {
            alert("Vui lòng đăng nhập để mua hàng!");
            navigate('/login');
            return;
        }

        try {
            await api.post('/cart/add', { product_id: productId, quantity: 1 });
            alert("Đã thêm vào giỏ hàng!");
        } catch (error) {
            alert(error.response?.data?.message || "Lỗi khi thêm giỏ hàng");
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Danh sách Cà Phê</h2>
                <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                <button onClick={() => navigate('/cart')} style={{ marginRight: '10px', padding: '8px', background: '#ffc107', border: 'none', cursor: 'pointer' }}>
                    🛒 Giỏ hàng
                </button>
                {!localStorage.getItem('token') ? (
                    <button onClick={() => navigate('/login') } style={{ padding: '8px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
                        Đăng nhập
                    </button>
                ) : (
                    <button onClick={() => {
                        localStorage.clear(); // Đăng xuất
                        window.location.reload();
                    }} style={{ padding: '8px', background: '#dc3545', color: 'white', border: 'none', cursor: 'pointer' }}>
                        Đăng xuất
                    </button>
                )}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
                {products.map(product => (
                    <div key={product.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
                        {/* Hiển thị ảnh giả nếu chưa có URL thật */}
                        <img 
                            src={product.image || "https://via.placeholder.com/250"} 
                            alt={product.name} 
                            style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                        />
                        <h3 style={{ margin: '10px 0' }}>{product.name}</h3>
                        <p style={{ color: 'red', fontWeight: 'bold' }}>{Number(product.price).toLocaleString()} VNĐ</p>
                        <p style={{ fontSize: '14px', color: '#555' }}>Nguồn gốc: {product.origin}</p>
                        
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button 
                                onClick={() => addToCart(product.id)}
                                style={{ flex: 1, padding: '8px', cursor: 'pointer', background: '#28a745', color: 'white', border: 'none' }}
                            >
                                Thêm giỏ hàng
                            </button>
                            {/* Nút này sẽ dẫn sang trang chi tiết (ta sẽ làm ở bước sau) */}
                            <button 
                                onClick={() => navigate(`/product/${product.id}`)}
                                style={{ flex: 1, padding: '8px', cursor: 'pointer', background: '#17a2b8', color: 'white', border: 'none' }}
                            >
                                Truy xuất
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Products;