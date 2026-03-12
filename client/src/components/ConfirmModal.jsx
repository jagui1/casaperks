import { useEffect, useRef } from 'react';

function ConfirmModal({
  open,
  giftCard,
  currentBalance,
  onConfirm,
  onCancel,
  loading,
  error
}) {
  const overlayRef = useRef(null);

  const projectedBalance = giftCard
    ? Math.max(0, (currentBalance ?? 0) - giftCard.pointCost)
    : 0;

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel?.();
    };
    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, onCancel]);

  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onCancel?.();
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="rounded-xl border border-slate-700 bg-slate-900 p-8 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-modal-title" className="text-xl font-semibold mb-6">
          Confirm Redemption
        </h2>
        {giftCard && (
          <>
            <p className="text-slate-300 mb-4">You are about to redeem:</p>
            <div className="rounded-lg bg-slate-800/50 p-4 mb-4">
              <div className="font-medium text-slate-100">🎁 {giftCard.brand} Gift Card</div>
              <div className="text-sm text-slate-400">{giftCard.pointCost.toLocaleString()} points</div>
            </div>
            <p className="text-slate-400 text-sm mb-2">Remaining balance after:</p>
            <p className="text-amber-400 font-semibold mb-6">{projectedBalance.toLocaleString()} points</p>
          </>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-800/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm?.(giftCard)}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Redeeming…' : 'Confirm Redeem'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
