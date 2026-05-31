const getBarColor = (pct, thresholdLow, thresholdHigh, mobile) => {
  if (pct >= thresholdHigh) return `bg-green-300 ${mobile ? "dark:bg-green-900" : "dark:bg-green-600"}`;
  if (pct >= thresholdLow) return `bg-orange-300 ${mobile ? "dark:bg-orange-900" : "dark:bg-orange-500"}`;
  return `bg-red-300 ${mobile ? "dark:bg-red-900" : "dark:bg-red-600"}`;
};

/**
 * A progress bar with threshold-based coloring.
 *
 * @param {number} value - Current count
 * @param {number} total - Maximum count
 * @param {number} thresholdLow - % at which bar turns orange (default 50)
 * @param {number} thresholdHigh - % at which bar turns green (default 70)
 * @param {(value: number, total: number, pct: number) => string} [label] - Custom label renderer
 * @param {boolean} [mobile] - Darker dark-mode colors + top margin
 */
const ProgressBar = ({ value, total, thresholdLow = 50, thresholdHigh = 70, label, mobile = false }) => {
  if (!total || total === 0) return null;

  const pct = Math.min(100, Math.round((value / total) * 100));
  const barColor = getBarColor(pct, thresholdLow, thresholdHigh, mobile);
  const displayLabel = label ? label(value, total, pct) : `${value}/${total} (${pct}%)`;

  return (
    <div className={mobile ? "mt-2" : ""}>
      <div className="relative h-5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-200">
          {displayLabel}
        </span>
      </div>
    </div>
  );
};

export default ProgressBar;
