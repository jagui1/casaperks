import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PointsBadge from '../components/PointsBadge';
import TransactionRow from '../components/TransactionRow';

function DashboardPage() {
  const { user, profile } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const profileLoading = user?.role === 'resident' && profile == null;

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLoading(true);
    apiClient.get('/api/transactions')
      .then((r) => {
        if (cancelled) return;
        setTransactions((r.data?.data ?? []).slice(0, 5));
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Failed to load dashboard');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (profileLoading || loading) {
    return (
      <div className="text-slate-400">Loading...</div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-800/50 bg-red-950/20 px-4 py-3 text-red-300">
        {error}
      </div>
    );
  }

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-1">
        {greeting}, {profile?.fullName ?? 'Resident'} 👋
      </h1>
      {profile?.unit != null && (
        <p className="text-slate-400 mb-6">Unit {profile.unit}</p>
      )}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 mb-8">
        <div className="text-sm font-medium text-slate-400 mb-2">⭐ YOUR POINTS BALANCE</div>
        <PointsBadge points={profile?.pointsBalance ?? 0} className="text-3xl font-bold text-amber-400" />
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <Link to="/transactions" className="text-sm text-indigo-400 hover:text-indigo-300">
          View All →
        </Link>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 divide-y divide-slate-800 px-4">
        {transactions.length === 0 ? (
          <div className="py-6 text-sm text-slate-400">No transactions yet.</div>
        ) : (
          transactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              date={tx.createdAt}
              description={tx.description}
              points={tx.points}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default DashboardPage;
