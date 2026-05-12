// Đây là trang Login, nơi người dùng sẽ nhập email và mật khẩu để đăng nhập vào hệ thống
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/login", { email, password });

      if (response.data.success) {
        // Lưu token và thông tin user vào localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        alert("Đăng nhập thành công!");
        // Chuyển hướng sang trang sản phẩm
        navigate("/products");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi đăng nhập!");
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        border: "1px solid #ccc",
        padding: "20px",
        borderRadius: "8px",
      }}
    >
      <h2>Đăng nhập DNC Trace</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form
        onSubmit={handleLogin}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <input
          type="email"
          placeholder="Email (vd: superadmin@gmail.com)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: "10px" }}
        />
        <input
          type="password"
          placeholder="Mật khẩu (vd: 123)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: "10px" }}
        />
        <button
          type="submit"
          style={{
            padding: "10px",
            background: "#007bff",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          Đăng nhập
        </button>
      </form>
      {/* THÊM ĐOẠN NÀY VÀO DƯỚI CÙNG */}
      <div style={{ marginTop: "20px", textAlign: "center", fontSize: "14px" }}>
        Chưa có tài khoản?{" "}
        <Link to="/register" style={{ color: "#28a745", textDecoration: "none", fontWeight: "bold" }}>
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
};

export default Login;
