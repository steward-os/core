import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * The sections a message is narrowed to: removable chips plus a search field that offers the remaining
 * sections. Nothing picked shows the hint "Laat leeg voor iedereen" until the field gets focus; once
 * sections are picked the field hides behind a + after the chips. Picking a section drops the focus.
 *
 * @param {Array<{id: string, name: string}>} options
 * @param {string[]} selectedIds
 * @param {(ids: string[]) => void} onChange
 */
const SectionPicker = ({ options = [], selectedIds = [], onChange, disabled = false, className = "" }) => {
  const [adding, setAdding] = useState(false);
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPos, setDropdownPos] = useState(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selected = selectedIds.map((id) => options.find((o) => o.id === id)).filter(Boolean);
  const unpicked = options.filter((o) => !selectedIds.includes(o.id));
  const matches = unpicked.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase()));
  const showField = selected.length === 0 || adding;

  // The + reveals the field; focus it once it is there.
  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  function placeDropdown() {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const openUpward = rect.top > window.innerHeight - rect.bottom;
    setDropdownPos(
      openUpward
        ? { bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width }
        : { top: rect.bottom + 4, left: rect.left, width: rect.width },
    );
  }

  function pick(section) {
    onChange([...selectedIds, section.id]);
    setQuery("");
    setFocusedIndex(-1);
    inputRef.current?.blur();
  }

  function handleKeyDown(e) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((i) => (i < matches.length - 1 ? i + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((i) => (i > 0 ? i - 1 : matches.length - 1));
        break;
      case "Enter": {
        e.preventDefault();
        const match = matches[focusedIndex] || (matches.length === 1 ? matches[0] : null);
        if (match) pick(match);
        break;
      }
      case "Escape":
        inputRef.current?.blur();
        break;
    }
  }

  return (
    <div ref={containerRef} className={`flex flex-wrap items-center gap-1.5 min-h-[36px] ${className}`}>
      {selected.map((section) => (
        <span
          key={section.id}
          className="inline-flex items-center gap-1 pl-3 pr-1 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
        >
          {section.name}
          <button
            type="button"
            onClick={() => onChange(selectedIds.filter((id) => id !== section.id))}
            disabled={disabled}
            className="rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
            aria-label={`${section.name} verwijderen`}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </span>
      ))}
      {!showField && unpicked.length > 0 && (
        <button
          type="button"
          onClick={() => setAdding(true)}
          disabled={disabled}
          className="rounded-full p-1.5 text-blue-600 dark:text-blue-400 hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-50"
          aria-label="Sectie toevoegen"
        >
          <PlusIcon className="w-5 h-5" />
        </button>
      )}
      {showField && (
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          data-bwignore="true"
          data-lpignore="true"
          data-1p-ignore="true"
          value={query}
          disabled={disabled}
          onChange={(e) => {
            setQuery(e.target.value);
            setFocusedIndex(-1);
          }}
          onFocus={() => {
            placeDropdown();
            setFocused(true);
          }}
          onBlur={() => {
            setFocused(false);
            setAdding(false);
            setQuery("");
            setFocusedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          placeholder={focused || selected.length > 0 ? "" : "Laat leeg voor iedereen"}
          className="flex-1 min-w-[8rem] py-1 bg-transparent text-[var(--text-primary)] placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
        />
      )}

      {/* In a portal: a fixed element inside a panel with a backdrop filter is positioned relative to that panel. */}
      {focused && dropdownPos && matches.length > 0 && createPortal(
        <ul
          style={{ position: "fixed", top: dropdownPos.top, bottom: dropdownPos.bottom, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
          className="glass-panel rounded-2xl shadow-xl max-h-60 overflow-auto py-1"
        >
          {matches.map((section, index) => (
            <li key={section.id}>
              <button
                type="button"
                // mousedown keeps the field focused until the pick is made
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(section);
                }}
                className={`w-full px-3 py-2 text-left text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  index === focusedIndex ? "bg-blue-100 dark:bg-blue-900" : ""
                }`}
              >
                {section.name}
              </button>
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </div>
  );
};

export default SectionPicker;
