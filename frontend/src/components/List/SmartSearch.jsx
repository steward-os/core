import { useState } from "react";
import TagSelector from "../Form/TagSelector";
import { useSmartUrlParams } from "./useSmartTagFilter";

/**
 * SmartSearch — unified tag + text search bar.
 * Manages its own URL state; pair with useSmartTagFilter() in the page to get queryOptions.
 *
 * @param {Object}   props
 * @param {Array}    props.availableTags  - Tag options to display
 * @param {string[]} [props.searchFields] - PocketBase fields to OR-search on text input (Enter/button)
 * @param {boolean}  [props.enableAndOr]  - Show AND/OR mode toggle for multi-tag filter
 * @param {string}   [props.placeholder]
 */
const SmartSearch = ({
  availableTags,
  searchFields,
  enableAndOr = false,
  placeholder = "Zoek of selecteer tags...",
  children,
}) => {
  const { selectedTagIds, tagFilterMode, searchQuery, updateParam, updateParams } = useSmartUrlParams();
  const [pendingSearch, setPendingSearch] = useState("");

  const setSelectedTagIds = (ids) => updateParam("selectedTagIds", ids.join(","));
  const setTagFilterMode = (mode) => updateParam("tagFilterMode", mode === "OR" ? "" : mode);

  const commitSearch = (text) =>
    updateParams({
      q: text,
      qf: text ? `(${searchFields.map((f) => `${f} ~ "${text}"`).join(" || ")})` : "",
    });

  const showSearch = searchFields?.length > 0;
  const showAndOrMode = enableAndOr && selectedTagIds.length > 1;
  const hasActiveFilters = selectedTagIds.length > 0 || searchQuery;

  if (!availableTags?.length && !showSearch && !children) return null;

  return (
    <div className="mb-4">
      {showAndOrMode && (
        <div className="flex items-center gap-2 mb-2 justify-end">
          <span className="text-sm text-gray-600 dark:text-gray-400">Modus:</span>
          {["OR", "AND"].map((mode) => (
            <button
              key={mode}
              onClick={() => setTagFilterMode(mode)}
              className={`px-3 py-1 text-xs rounded-full transition-all ${tagFilterMode === mode
                  ? "bg-blue-600/10 text-blue-600 ring-1 ring-blue-600/30"
                  : "bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] hover:bg-black/10 dark:hover:bg-white/10"
                }`}
            >
              {mode === "OR" ? "OF" : "EN"}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 max-w-2xl">
        <div className="flex-1">
          <TagSelector
            availableTags={availableTags || []}
            selectedTagIds={selectedTagIds}
            onTagsChange={setSelectedTagIds}
            onSearch={showSearch ? commitSearch : undefined}
            onSearchTermChange={showSearch ? setPendingSearch : undefined}
            searchQuery={searchQuery || undefined}
            onClearSearch={showSearch ? () => commitSearch("") : undefined}
            inputValue={showSearch ? pendingSearch : undefined}
            placeholder={placeholder}
          />
        </div>
        {showSearch && pendingSearch && (
          <button
            onClick={() => { commitSearch(pendingSearch); setPendingSearch(""); }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-2xl transition-all shadow-md active:scale-95"
          >
            Zoeken
          </button>
        )}
      </div>

      {showAndOrMode && (
        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
          {tagFilterMode === "OR"
            ? "Toon items met minimaal één van de geselecteerde tags"
            : "Toon items met alle geselecteerde tags"}
        </p>
      )}

      {children && <div className="mt-3">{children}</div>}

      {hasActiveFilters && (
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => { setSelectedTagIds([]); commitSearch(""); }}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Wis filters
          </button>
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
