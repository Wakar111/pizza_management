import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminMenu from './pages/admin/Menu';
import AdminOrders from './pages/admin/Orders';
import AdminSettings from './pages/admin/Settings';
import AdminStammkunden from './pages/admin/Stammkunden';
import UserInfo from './pages/user/Info';
import AGB from './pages/user/AGB';
import Datenschutz from './pages/user/Datenschutz';
import Impressum from './pages/user/Impressum';
import './index.css';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="menu" element={<Menu />} />
        <Route path="cart" element={<Cart />} />
        <Route path="login" element={<Login />} />

        {/* User Routes */}
        <Route path="user">
          <Route path="info" element={<UserInfo />} />
          <Route path="agb" element={<AGB />} />
          <Route path="datenschutz" element={<Datenschutz />} />
          <Route path="impressum" element={<Impressum />} />
        </Route>

        {/* Admin Routes */}
        <Route path="admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="admin/menu" element={
          <ProtectedRoute>
            <AdminMenu />
          </ProtectedRoute>
        } />
        <Route path="admin/orders" element={
          <ProtectedRoute>
            <AdminOrders />
          </ProtectedRoute>
        } />
        <Route path="admin/settings" element={
          <ProtectedRoute>
            <AdminSettings />
          </ProtectedRoute>
        } />
        <Route path="admin/stammkunden" element={
          <ProtectedRoute>
            <AdminStammkunden />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
