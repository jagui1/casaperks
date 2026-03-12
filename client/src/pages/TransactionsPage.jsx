import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import TransactionRow from '../components/TransactionRow';

function TransactionsPage() {
  const [data, setData] = useState({ data: [], page: 1, limit: 10, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPage = (page) => {
    setError(null);
    setLoading(true);
    apiClient.get('/api/transactions', { params: { page, limit: 10 } })
      .then((r) => {
        setData({
          data: r.data?.data ?? [],
          page: r.data?.page ?? 1,
          limit: r.data?.limit ?? 10,
          total: r.data?.total ?? 0
        });
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load transactions');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));
  const onPrev = () => fetchPage(data.page - 1);
  const onNext = () => fetchPage(data.page + 1);

  if (error) {
    return (
      <div className="rounded-lg border border-red-800/50 bg-red-950/20 px-4 py-3 text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Transaction History</h1>
      {loading && data.data.length === 0 ? (
        <div className="text-slate-400">Loading...</div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 divide-y divide-slate-800 px-4 overflow-hidden">
            {data.data.length === 0 ? (
              <div className="py-8 text-slate-400 text-center">No transactions yet.</div>
            ) : (
              data.data.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  date={tx.createdAt}
                  description={tx.description}
                  points={tx.points}
                />
              ))
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={onPrev}
              disabled={data.page <= 1 || loading}
              className="rounded border border-slate-700 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 hover:bg-slate-800"
            >
              ← Prev
            </button>
            <span className="text-sm text-slate-400">
              Page {data.page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={onNext}
              disabled={data.page >= totalPages || loading}
              className="rounded border border-slate-700 px-3 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 hover:bg-slate-800"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TransactionsPage;
