import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Admin from './pages/Admin';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Header from './components/Header';
import AdminProducts from './pages/AdminProducts';
import Checkout from './pages/Checkout';
import Register from './pages/Register';
import AdminOrders from './pages/AdminOrders';

function App() {
  return (
    <Router>
      <Header />
      <div className="app-container" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        <Routes>
          {/* Mặc định vào thẳng trang sản phẩm */}
          <Route path="/" element={<Navigate to="/products" />} />
      
          <Route path="/login" element={<Login />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path='/checkout' element={<Checkout />} />
          <Route path='/register' element={<Register />} />
          <Route path="/admin/orders" element={<AdminOrders />} />

        </Routes>
      </div>
    </Router>
  );
}

export default App;