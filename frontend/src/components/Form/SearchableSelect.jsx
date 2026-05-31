import { useState, useRef, useEffect } from "react";
import { ChevronDownIcon, XMarkIcon } from "@heroicons/react/24/outline";

/**
 * Compact searchable select for use in table rows.
 * Accepts pre-loaded options — no fetching.
 *
 * @param {Array<{value: string, label: string}>} options
 * @param {string} value - currently selected value
 * @param {(value: string) => void} onChange
 * @param {string} placeholder
 * @param {boolean} disabled
 */
const SearchableSelect = ({
  options = [],
  value = "",
  onChange,
  placeholder = "— Zoeken —",
  disabled = false,
  className = "",
  inputClassName = "",
  footerAction = null, // { label: string, onClick: () => void }
}) => {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  function open() {
    if (disabled) return;
    setSearch("");
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const openUpward = rect.top > window.innerHeight - rect.bottom;
      setDropdownPos(
        openUpward
          ? { bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width }
          : { top: rect.bottom + 4, left: rect.left, width: rect.width }
      );
    }
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function close() {
    setIsOpen(false);
    setSearch("");
  }

  function select(optValue) {
    onChange(optValue);
    close();
  }

  function clear(e) {
    e.stopPropagation();
    onChange("");
    close();
  }

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const baseInput = inputClassName ||
    "w-full px-2 py-1.5 text-sm bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-md text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50";

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {isOpen ? (
        /* Search input */
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Zoeken..."
          className={baseInput}
          onKeyDown={(e) => {
            if (e.key === "Escape") close();
            if (e.key === "Enter" && filtered.length === 1) select(filtered[0].value);
          }}
        />
      ) : (
        /* Display button */
        <button
          type="button"
          onClick={open}
          disabled={disabled}
          className={`${baseInput} text-left flex items-center justify-between gap-1 pr-1 ${
            !value ? "text-[var(--text-secondary)]" : ""
          }`}
        >
          <span className="truncate">{value ? selectedLabel : placeholder}</span>
          <span className="flex items-center shrink-0">
            {value && !disabled && (
              <XMarkIcon
                className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 mr-0.5"
                onMouseDown={clear}
              />
            )}
            <ChevronDownIcon className="w-3.5 h-3.5 text-gray-400" />
          </span>
        </button>
      )}

      {/* Dropdown */}
      {isOpen && dropdownPos && (
        <div
          style={{ position: "fixed", top: dropdownPos.top, bottom: dropdownPos.bottom, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
          className="bg-white dark:bg-gray-800 border border-[var(--glass-border)] rounded-md shadow-lg max-h-52 overflow-y-auto"
        >
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-[var(--text-secondary)]">Geen resultaten</div>
          )}
          {filtered.map((opt) => (
            <div
              key={opt.value}
              onMouseDown={() => select(opt.value)}
              className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                opt.value === value
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "text-[var(--text-primary)]"
              }`}
            >
              {opt.label}
            </div>
          ))}
          {footerAction && (
            <div className="border-t border-[var(--glass-border)] sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); footerAction.onClick(); }}
                className="w-full px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
              >
                {footerAction.label}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
