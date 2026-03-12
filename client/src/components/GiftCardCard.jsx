import { useState } from 'react';

function GiftCardCard({ id, brand, pointCost, pointsBalance, onRedeem }) {
  const canRedeem = pointCost <= pointsBalance;
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 flex flex-col items-center gap-4 min-w-[160px]">
      <div className="text-lg font-semibold text-slate-100">{brand}</div>
      <div className="text-sm text-slate-400">{pointCost.toLocaleString()} pts</div>
      <div className="relative mt-auto">
        <button
          type="button"
          onClick={() => canRedeem && onRedeem?.({ id, brand, pointCost })}
          disabled={!canRedeem}
          onMouseEnter={() => !canRedeem && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
        >
          Redeem
        </button>
        {showTooltip && !canRedeem && (
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 rounded bg-slate-800 text-slate-200 text-xs whitespace-nowrap z-10"
            role="tooltip"
          >
            Not enough points
          </div>
        )}
      </div>
    </div>
  );
}

export default GiftCardCard;
