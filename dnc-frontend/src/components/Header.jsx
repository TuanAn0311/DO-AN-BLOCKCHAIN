import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Header = () => {
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    const fetchCartCount = async () => {
      if (!userStr) {
        setCartCount(0);
        return;
      }

      try {
        const res = await api.get('/cart');
        const count = res.data.data.reduce((acc, item) => acc + item.quantity, 0);
        setCartCount(count);
      } catch (error) {
        console.error('Lỗi đếm số lượng sản phẩm trong giỏ hàng:', error);
      }
    };

    fetchCartCount();
    window.addEventListener('cartUpdate', fetchCartCount);
    const interval = setInterval(fetchCartCount, 30000);

    return () => {
      window.removeEventListener('cartUpdate', fetchCartCount);
      clearInterval(interval);
    };
  }, [userStr]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <button className="brand" onClick={() => navigate('/products')} type="button">
          <span className="brand__mark">D</span>
          <span>DNC Trace</span>
        </button>

        <nav className="main-nav" aria-label="Điều hướng chính">
          <Link className="nav-link" to="/products">Cửa hàng</Link>
          <Link className="nav-link" to="/cart">
            Giỏ hàng
            {cartCount > 0 && (
              <span className="cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
            )}
          </Link>
          <Link className="nav-link" to="/orders">Đơn hàng</Link>
          {user && <Link className="nav-link" to="/profile">Hồ sơ</Link>}
          {user?.role === 'admin' && (
            <Link className="nav-link" to="/admin">Admin</Link>
          )}

          {user ? (
            <div className="user-menu">
              <span className="user-greeting">
                Chào, <strong>{user.full_name}</strong>
              </span>
              <button className="btn btn-secondary" onClick={handleLogout} type="button">
                Đăng xuất
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={() => navigate('/login')} type="button">
              Đăng nhập
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
