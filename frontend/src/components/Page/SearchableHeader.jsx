import { ArrowLeftIcon, MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";

/**
 * A list page's header with a magnifier, like the Android app: tapping it turns the title into a search
 * field. The arrow or Escape closes it and clears the search. [actions] (e.g. an AddButton) sit on the
 * right; an AddButton shows as a floating button on mobile by itself.
 */
const SearchableHeader = ({ title, query, onQueryChange, placeholder = "Zoeken", actions = null }) => {
  // A search that was left open (e.g. before opening an item) stays open.
  const [searching, setSearching] = useState(query.length > 0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (searching) inputRef.current?.focus();
  }, [searching]);

  const close = () => {
    setSearching(false);
    onQueryChange("");
  };

  const iconButton = "p-2 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors";

  return (
    <div className="mb-6 rounded-2xl backdrop-blur-sm bg-white/40 dark:bg-black/20 border border-black/10 dark:border-white/10">
      <div className="px-2 md:px-4 py-2 md:py-4 flex items-center gap-2 min-h-[3.5rem]">
        {searching ? (
          <>
            <button type="button" onClick={close} className={iconButton} aria-label="Zoeken sluiten">
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && close()}
              placeholder={placeholder}
              aria-label={placeholder}
              className="flex-1 min-w-0 bg-transparent text-lg text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button type="button" onClick={() => onQueryChange("")} className={iconButton} aria-label="Zoekopdracht wissen">
                <XMarkIcon className="w-5 h-5" />
              </button>
            )}
          </>
        ) : (
          <>
            <h1 className="flex-1 px-2 text-xl md:text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
            <button type="button" onClick={() => setSearching(true)} className={iconButton} aria-label="Zoeken">
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
          </>
        )}
        {actions}
      </div>
    </div>
  );
};

export default SearchableHeader;
