// api.js sẽ tạo một instance của axios với baseURL là địa chỉ của backend API, và sử dụng interceptor để tự động đính kèm token JWT vào header của mỗi request nếu token tồn tại trong localStorage. Điều này giúp cho việc xác thực người dùng trở nên dễ dàng hơn khi frontend gửi request đến backend.
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Tự động đính kèm Token vào Header trước khi gửi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Ta sẽ lưu token ở localStorage khi login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
