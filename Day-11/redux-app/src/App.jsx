import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './pages/Login.jsx';
import Todos from './pages/Todos.jsx';
import Shop from './pages/Shop.jsx';
import Cart from './pages/Cart.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/shop" replace />} />
        <Route path="shop" element={<Shop />} />
        <Route path="cart" element={<Cart />} />
        <Route path="login" element={<Login />} />
        {/* Only logged-in users (auth slice has a token) can see the todos */}
        <Route element={<ProtectedRoute />}>
          <Route path="todos" element={<Todos />} />
        </Route>
        <Route path="*" element={<p className="empty">Page not found.</p>} />
      </Route>
    </Routes>
  );
}
