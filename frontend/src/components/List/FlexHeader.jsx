import { useRef, useState } from "react";
import { getColumnFilterKey } from "../../hooks/utils/columnUtils";

export const FlexHeader = ({
  columns,
  className = "",
  onFilterApply,
  onSortClick,
  sortField,
  sortDirection,
  filters = {},
  headerType = "default",
}) => {
  const [activeFilterIdx, setActiveFilterIdx] = useState(null);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  const FilterIcon = ({ className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={`w-4 h-4 ${className}`}>
      <path
        fillRule="evenodd"
        d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 0 1 .628.74v2.288a2.25 2.25 0 0 1-.659 1.59l-4.682 4.683a2.25 2.25 0 0 0-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 0 1 8 18.25v-5.757a2.25 2.25 0 0 0-.659-1.591L2.659 6.22A2.25 2.25 0 0 1 2 4.629V2.34a.75.75 0 0 1 .628-.74z"
        clipRule="evenodd"
      />
    </svg>
  );

  const SortIndicator = ({ direction }) => {
    if (!direction) return null;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={`w-4 h-4 ml-1 ${direction === "desc" ? "transform rotate-180" : ""}`}
      >
        <path
          fillRule="evenodd"
          d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const openFilter = (column, index, e) => {
    e.stopPropagation();
    const currentValue = filters[getColumnFilterKey(column)] || "";
    setActiveFilterIdx(index);
    setInputValue(currentValue);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const applyFilter = (column) => {
    onFilterApply?.(inputValue, getColumnFilterKey(column));
    setActiveFilterIdx(null);
  };

  const clearFilter = (column, e) => {
    e.stopPropagation();
    onFilterApply?.("", getColumnFilterKey(column));
    setActiveFilterIdx(null);
  };

  const handleKeyDown = (e, column) => {
    if (e.key === "Enter") {
      applyFilter(column);
    } else if (e.key === "Escape") {
      setActiveFilterIdx(null);
    }
  };

  const containerClass = headerType === "simple"
    ? `flex items-center py-2 px-4 border-b border-[var(--border-subtle)]`
    : `glass-header sticky top-0 z-10 flex items-center py-2.5 px-4`;

  return (
    <div className={`${containerClass} ${className}`}>
      {columns.map((column, index) => {
        const isFilterActive = activeFilterIdx === index;
        const filterKey = getColumnFilterKey(column);
        const hasActiveFilter = filterKey && filters[filterKey] && filters[filterKey].trim();

        return (
          <div
            key={index}
            style={column.width ? { width: column.width } : { flex: 1 }}
            className={`font-medium text-[var(--text-secondary)] text-[13px] tracking-wide ${column.className || ""}`}
          >
            <div className="flex items-center px-0.5 relative w-full h-full">
              {isFilterActive ? (
                /* Inline filter input */
                <div className="flex-1 flex items-center gap-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, column)}
                    onBlur={() => applyFilter(column)}
                    className="flex-1 min-w-0 px-2 py-0.5 text-[13px] bg-black/5 dark:bg-white/10 border border-blue-500/50 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-[var(--text-primary)]"
                    placeholder={`${column.label}...`}
                  />
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyFilter(column);
                    }}
                    className="shrink-0 text-green-600 hover:text-green-500 transition-colors"
                    aria-label="Filter toepassen"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault();
                      clearFilter(column, e);
                    }}
                    className="shrink-0 text-[var(--text-secondary)] hover:text-red-500 transition-colors"
                    aria-label="Filter wissen"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  </button>
                </div>
              ) : (
                /* Normal header content */
                <div className="flex-1 flex items-center">
                  {column.sortable ? (
                    <button
                      className="flex items-center hover:text-[var(--text-primary)] transition-colors"
                      onClick={() => onSortClick && onSortClick(column.field)}
                    >
                      <span className={sortField === column.field ? "text-[var(--text-primary)] font-semibold" : ""}>
                        {column.label}
                      </span>
                      {sortField === column.field && <SortIndicator direction={sortDirection} />}
                    </button>
                  ) : (
                    <span>{column.label}</span>
                  )}

                  {column.filter && (
                    <>
                      <button
                        onClick={(e) => openFilter(column, index, e)}
                        className={`ml-1 p-1 rounded-full hover:bg-white/10 transition-colors ${
                          hasActiveFilter ? "text-blue-500" : "text-[var(--text-secondary)]"
                        }`}
                        aria-label={`Filter ${column.label}`}
                        title={`Filter op ${column.label}`}
                      >
                        <FilterIcon />
                      </button>
                      {hasActiveFilter && (
                        <span className="inline-flex items-center gap-0.5 ml-1 pl-2 pr-1 py-0.5 text-[11px] font-medium bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded-full max-w-[80px] shrink-0">
                          <span className="truncate">{filters[filterKey]}</span>
                          <button
                            onClick={(e) => clearFilter(column, e)}
                            className="shrink-0 hover:text-red-500 transition-colors"
                            aria-label="Filter wissen"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-3 h-3"
                            >
                              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22z" />
                            </svg>
                          </button>
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
