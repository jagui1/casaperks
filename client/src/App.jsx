import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import RewardsPage from './pages/RewardsPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/rewards" element={<RewardsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;

