import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Admin from './pages/Admin';
import Cart from './pages/Cart';

function App() {
  return (
    <Router>
      <div className="app-container" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <Routes>
          {/* Mặc định vào thẳng trang sản phẩm */}
          <Route path="/" element={<Navigate to="/products" />} />
      
          <Route path="/login" element={<Login />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;