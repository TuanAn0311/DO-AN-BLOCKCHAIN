import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="footer-grid">
          <div>
            <h3>DNC Trace</h3>
            <p>
              Hệ thống truy xuất nguồn gốc cà phê ứng dụng blockchain, giúp người mua
              kiểm chứng hành trình sản phẩm từ nông trại đến đóng gói.
            </p>
          </div>

          <div>
            <h4>Liên kết nhanh</h4>
            <ul className="footer-links">
              <li><Link to="/products">Cửa hàng</Link></li>
              <li><Link to="/cart">Giỏ hàng</Link></li>
              <li><Link to="/orders">Đơn hàng của tôi</Link></li>
              <li><Link to="/admin">Quản trị</Link></li>
            </ul>
          </div>

          <div>
            <h4>Thông tin liên hệ</h4>
            <p>Phường Mỹ An, Quận Ngũ Hành Sơn, TP. Đà Nẵng</p>
            <p>0974.134.027</p>
            <p>andqt.23it@vku.udn.com</p>
          </div>
        </div>

        <div className="footer-bottom">
          © {new Date().getFullYear()} DNC Trace. Đồ án Blockchain.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
