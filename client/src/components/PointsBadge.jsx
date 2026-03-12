/**
 * Displays points balance with comma-separated formatting (e.g. "1,450 pts").
 * Used in Layout (sidebar), Dashboard, and Rewards page so balance stays consistent.
 */
function PointsBadge({ points, className = '' }) {
  const formatted = typeof points === 'number' ? points.toLocaleString() : '0';
  return (
    <span className={className}>
      {formatted} pts
    </span>
  );
}

export default PointsBadge;
