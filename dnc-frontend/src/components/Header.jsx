import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const Header = () => {
    const navigate = useNavigate();
    const [cartCount, setCartCount] = useState(0);
    
    // Lấy thông tin user hiện tại để hiển thị nút phù hợp
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    // Tải số lượng sản phẩm trong giỏ hàng (nếu đã đăng nhập)
    useEffect(() => {
        const fetchCartCount = async () => {
            if(!user) return;
            try {
                const res = await api.get('/cart');
                const count = res.data.data.reduce((acc, item) => acc + item.quantity, 0);
                setCartCount(count);
            } catch (error) {
                console.error('Lỗi đếm số lượng sản phẩm trong giỏ hàng:', error);
            }
        };

        fetchCartCount();
        const interval = setInterval(fetchCartCount, 30000); // Cập nhật số lượng giỏ hàng mỗi 30 giây
        return () => clearInterval(interval); // Dọn dẹp interval khi component unmount
    }, [user]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <header style={{
            position: 'sticky',
            top: 0,                   // Ghim sát mép trên
            zIndex: 1000,             // Đảm bảo luôn nằm đè lên các nội dung khác
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)', // Tạo bóng đổ nhẹ để phân cách
            padding: '15px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontFamily: 'sans-serif'
        }}>
            {/* Logo / Tên thương hiệu */}
            <h2 
                onClick={() => navigate('/products')} 
                style={{ margin: 0, color: '#007bff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
                🌱 DNC Trace
            </h2>

            {/* Menu điều hướng */}
            <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <Link to="/products" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>🏠 Cửa hàng</Link>
                <Link to="/cart" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>🛒 Giỏ hàng
                    {cartCount > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-12px',
                            background: '#dc3545',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            padding: '2px 6px',
                            borderRadius: '50%',
                            minWidth: '15px',
                            textAlign: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                            {cartCount > 99 ? '99+' : cartCount}
                        </span>
                    )}
                </Link>
                <Link to="/orders" style={{ textDecoration: 'none', color: '#333', fontWeight: 'bold' }}>📦 Đơn hàng</Link>
                
                {/* Chỉ hiện nút Admin nếu là tài khoản admin */}
                {user?.role === 'admin' && (
                    <Link to="/admin" style={{ textDecoration: 'none', color: '#28a745', fontWeight: 'bold' }}>⚙️ Admin</Link>
                )}

                {/* Phân biệt nút Đăng nhập / Đăng xuất */}
                {user ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginLeft: '10px', borderLeft: '2px solid #eee', paddingLeft: '20px' }}>
                        <span style={{ color: '#666', fontSize: '14px' }}>Chào, <strong>{user.full_name}</strong></span>
                        <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Đăng xuất</button>
                    </div>
                ) : (
                    <button onClick={() => navigate('/login')} style={{ marginLeft: '10px', padding: '8px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Đăng nhập</button>
                )}
            </nav>
        </header>
    );
};

export default Header;