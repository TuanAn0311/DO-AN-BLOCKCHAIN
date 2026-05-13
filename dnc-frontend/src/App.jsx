import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';

import Footer from './components/Footer';
import Header from './components/Header';
import { ToastProvider } from './components/ToastProvider';

const Login = lazy(() => import('./pages/Login'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Admin = lazy(() => import('./pages/Admin'));
const Cart = lazy(() => import('./pages/Cart'));
const Orders = lazy(() => import('./pages/Orders'));
const AdminProducts = lazy(() => import('./pages/AdminProducts'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Register = lazy(() => import('./pages/Register'));
const AdminOrders = lazy(() => import('./pages/AdminOrders'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Profile = lazy(() => import('./pages/Profile'));

function App() {
  return (
    <Router>
      <ToastProvider>
        <Header />
        <main className="app-shell">
          <Suspense fallback={<div className="loading-state">Đang tải trang...</div>}>
            <Routes>
              <Route path="/" element={<Navigate to="/products" />} />
              <Route path="/login" element={<Login />} />
              <Route path="/products" element={<Products />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </ToastProvider>
    </Router>
  );
}

export default App;
