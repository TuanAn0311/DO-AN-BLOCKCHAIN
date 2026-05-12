import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    // Kiểm tra mật khẩu khớp nhau
    if (password !== confirmPassword) {
      return setError("Mật khẩu xác nhận không khớp!");
    }

    setIsLoading(true);
    try {
      const response = await api.post("/auth/register", { 
        full_name: fullName, 
        email, 
        password 
      });

      if (response.data.success) {
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        navigate("/login"); // Chuyển hướng về trang đăng nhập
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi đăng ký tài khoản!");
    } finally {
      setIsLoading(false);
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
        fontFamily: "sans-serif"
      }}
    >
      <h2 style={{ textAlign: "center", color: "#333" }}>Đăng ký Tài khoản</h2>
      {error && <p style={{ color: "red", background: "#f8d7da", padding: "10px", borderRadius: "5px" }}>{error}</p>}

      <form
        onSubmit={handleRegister}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <input
          type="text"
          placeholder="Họ và tên (vd: Nguyễn Tuấn An)"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          style={{ padding: "12px", border: "1px solid #ccc", borderRadius: "4px" }}
        />
        <input
          type="email"
          placeholder="Email thật (để nhận hóa đơn)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: "12px", border: "1px solid #ccc", borderRadius: "4px" }}
        />
        <input
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: "12px", border: "1px solid #ccc", borderRadius: "4px" }}
        />
        <input
          type="password"
          placeholder="Xác nhận lại mật khẩu"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          style={{ padding: "12px", border: "1px solid #ccc", borderRadius: "4px" }}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: "12px",
            background: isLoading ? "#6c757d" : "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontWeight: "bold",
            fontSize: "16px"
          }}
        >
          {isLoading ? "Đang xử lý..." : "Đăng ký"}
        </button>
      </form>

      <div style={{ marginTop: "20px", textAlign: "center", fontSize: "14px" }}>
        Đã có tài khoản?{" "}
        <Link to="/login" style={{ color: "#007bff", textDecoration: "none", fontWeight: "bold" }}>
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
};

export default Register;