/**
 * FilterRow - a row of filter controls above a list.
 *
 * Props:
 *   options   - [{ value, label }]
 *   value     - currently active value
 *   onChange  - (value: string) => void
 *   variant   - "pills" (default) | "select"
 */
const FilterRow = ({ options, value, onChange, variant = "pills" }) => {
  if (variant === "select") {
    return (
      <div className="flex justify-start items-center">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${value === option.value
              ? "bg-blue-500/20 text-blue-700 dark:bg-blue-500/25 dark:text-blue-300 ring-1 ring-blue-400/50 dark:ring-blue-400/40"
              : "bg-black/5 text-gray-500 dark:bg-white/10 dark:text-gray-400 hover:bg-black/10 dark:hover:bg-white/15"
            }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export { FilterRow };
