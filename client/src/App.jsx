import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import RewardsPage from './pages/RewardsPage';
import AdminPage from './pages/AdminPage';
import { useAuth } from './context/AuthContext';

function RequireAuth({ children, adminOnly = false }) {
  const { token, user } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly) {
    if (user?.role !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
    return children;
  }

  // Resident-only layout: redirect admins to /admin unless they're already there
  if (user?.role === 'admin' && location.pathname !== '/admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth adminOnly>
              <AdminPage />
            </RequireAuth>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

