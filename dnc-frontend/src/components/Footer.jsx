import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer style={{ background: '#212529', color: '#f8f9fa', padding: '40px 0 20px 0', marginTop: 'auto' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', padding: '0 20px', gap: '30px' }}>
                
                {/* Cột 1: Giới thiệu thương hiệu */}
                <div style={{ flex: '1 1 300px' }}>
                    <h3 style={{ color: '#28a745', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 15px 0' }}>
                        🌱 DNC Trace
                    </h3>
                    <p style={{ color: '#adb5bd', lineHeight: '1.6', fontSize: '14.5px', margin: 0 }}>
                        Hệ thống truy xuất nguồn gốc nông sản ứng dụng công nghệ Blockchain. Chúng tôi cam kết mang đến sự minh bạch, an toàn và nâng tầm giá trị hạt cà phê Việt Nam.
                    </p>
                </div>

                {/* Cột 2: Liên kết nhanh */}
                <div style={{ flex: '1 1 200px' }}>
                    <h4 style={{ marginBottom: '15px', color: '#fff', fontSize: '16px', marginTop: 0 }}>Liên kết nhanh</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <li><Link to="/" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '14.5px', transition: 'color 0.2s' }}>🏠 Trang chủ</Link></li>
                        <li><Link to="/products" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '14.5px' }}>🛒 Cửa hàng</Link></li>
                        <li><Link to="/cart" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '14.5px' }}>🛍️ Giỏ hàng</Link></li>
                        <li><Link to="/orders" style={{ color: '#adb5bd', textDecoration: 'none', fontSize: '14.5px' }}>📦 Đơn hàng của tôi</Link></li>
                    </ul>
                </div>

                {/* Cột 3: Thông tin liên hệ */}
                <div style={{ flex: '1 1 250px' }}>
                    <h4 style={{ marginBottom: '15px', color: '#fff', fontSize: '16px', marginTop: 0 }}>Thông tin liên hệ</h4>
                    <div style={{ color: '#adb5bd', fontSize: '14.5px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <span>📍</span>
                            <span>Phường Mỹ An, Quận Ngũ Hành Sơn, TP. Đà Nẵng</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <span>📞</span>
                            <span>0974.134.027</span>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <span>✉️</span>
                            <span>andqt.23it@vku.udn.com</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dòng bản quyền cuối trang */}
            <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #343a40', color: '#6c757d', fontSize: '14px', paddingBottom: '10px' }}>
                © {new Date().getFullYear()} DNC Trace. All rights reserved. Đồ án Blockchain.
            </div>
        </footer>
    );
};

export default Footer;