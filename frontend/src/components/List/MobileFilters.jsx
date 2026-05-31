import { FunnelIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { getColumnFilterKey } from "../../hooks/utils/columnUtils";

const MobileFilters = ({ headerColumns, filters, onFilterApply, onClearAllFilters }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localValues, setLocalValues] = useState({});

  const filterableColumns = headerColumns?.filter((col) => col.filter) || [];
  const activeFilterCount = Object.values(filters).filter((value) => value && value.trim()).length;

  if (filterableColumns.length === 0) return null;

  const getInputValue = (column) => {
    const key = getColumnFilterKey(column);
    return key in localValues ? localValues[key] : filters[key] || "";
  };

  const handleChange = (column, value) => {
    const key = getColumnFilterKey(column);
    setLocalValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = (column) => {
    const key = getColumnFilterKey(column);
    const value = key in localValues ? localValues[key] : filters[key] || "";
    onFilterApply?.(value, key);
    setLocalValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleKeyDown = (e, column) => {
    if (e.key === "Enter") handleApply(column);
    if (e.key === "Escape") {
      const key = getColumnFilterKey(column);
      setLocalValues((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleClear = (column) => {
    const key = getColumnFilterKey(column);
    setLocalValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    onFilterApply?.("", key);
  };

  return (
    <div className="md:hidden relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-all ${isOpen
            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            : "glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        aria-label="Toggle filters"
      >
        <FunnelIcon className="w-5 h-5" />
        {activeFilterCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 p-4 glass-panel rounded-xl space-y-3 z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Filters</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  onClearAllFilters();
                  setLocalValues({});
                  setIsOpen(false);
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Alles wissen
              </button>
            )}
          </div>

          {/* Inline filter inputs */}
          <div className="space-y-2">
            {filterableColumns.map((column) => {
              const key = getColumnFilterKey(column);
              const hasFilter = filters[key] && filters[key].trim();
              return (
                <div key={column.field} className="flex items-center gap-2">
                  <label className="text-xs text-[var(--text-secondary)] w-20 shrink-0">{column.label}</label>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={getInputValue(column)}
                      onChange={(e) => handleChange(column, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, column)}
                      className={`w-full pl-3 pr-8 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 bg-[var(--glass-bg)] text-[var(--text-primary)] ${hasFilter ? "border-blue-400 dark:border-blue-600" : "border-[var(--glass-border)]"
                        }`}
                      placeholder={`Filter op ${column.label.toLowerCase()}...`}
                    />
                    {getInputValue(column) && (
                      <button
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleClear(column);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                        aria-label="Filter wissen"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleApply(column);
                    }}
                    className="shrink-0 px-3 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                    aria-label="Filter toepassen"
                  >
                    Filter
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileFilters;
