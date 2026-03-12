/**
 * Single row for a transaction: date, description, and points (green if positive, red if negative).
 */
function TransactionRow({ date, description, points }) {
  const isPositive = points >= 0;
  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const pointsStr = isPositive ? `+${points}` : String(points);

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
      <div className="flex gap-4">
        <span className="text-sm text-slate-400 w-24 shrink-0">{formattedDate}</span>
        <span className="text-sm text-slate-200">{description}</span>
      </div>
      <span className={`text-sm font-medium shrink-0 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
        {pointsStr}
      </span>
    </div>
  );
}

export default TransactionRow;
