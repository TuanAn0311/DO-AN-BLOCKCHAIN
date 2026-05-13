import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError('');

    try {
      const response = await api.post('/auth/login', { email, password });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.dispatchEvent(new Event('cartUpdate'));
        navigate('/products');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi đăng nhập!');
    }
  };

  return (
    <section className="page-narrow">
      <div className="card auth-card">
        <div className="eyebrow">Tài khoản</div>
        <h2>Đăng nhập DNC Trace</h2>
        <p>Quản lý đơn hàng, giỏ hàng và theo dõi lịch sử truy xuất sản phẩm.</p>

        {error && <div className="alert alert-danger">{error}</div>}

        <form className="auth-form" onSubmit={handleLogin}>
          <input
            className="field"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="field"
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button className="btn btn-primary" type="submit">
            Đăng nhập
          </button>
        </form>

        <div className="auth-switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </div>
      </div>
    </section>
  );
};

export default Login;
