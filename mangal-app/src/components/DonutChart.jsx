const CHART_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#eab308', '#14b8a6', '#ef4444'];

export default function DonutChart({ balances }) {
  const total = balances.reduce((sum, balance) => sum + balance.totalPaid, 0);
  if (total === 0) return null;

  const cx = 90;
  const cy = 90;
  const radius = 62;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;

  const sorted = [...balances].sort((a, b) => b.totalPaid - a.totalPaid);
  const king = sorted[0];

  const slices = sorted.reduce(
    (acc, balance, i) => {
      const fraction = balance.totalPaid / total;
      acc.items.push({
        ...balance,
        fraction,
        offset: acc.offset,
        color: CHART_COLORS[i % CHART_COLORS.length],
      });
      acc.offset += fraction;
      return acc;
    },
    { items: [], offset: 0 },
  ).items;

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Mangalın Ağası</h3>
      <div className="flex items-center gap-6">
        <svg width="180" height="180" viewBox="0 0 180 180" className="flex-shrink-0">
          {slices.map((slice, i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference * slice.fraction} ${circumference}`}
              strokeDashoffset={-circumference * slice.offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          ))}
          <text x={cx} y={cy - 10} textAnchor="middle" fontSize="12" fill="#9ca3af">
            {king.name}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#f97316">
            {king.totalPaid} TL
          </text>
          <text x={cx} y={cy + 28} textAnchor="middle" fontSize="10" fill="#6b7280">
            %{Math.round((king.totalPaid / total) * 100)}
          </text>
        </svg>

        <ul className="space-y-2 flex-1">
          {slices.map((slice, i) => (
            <li key={i} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }} />
                <span className="text-sm truncate">{slice.name}</span>
                {i === 0 && <span className="text-xs">👑</span>}
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{slice.totalPaid} TL</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
