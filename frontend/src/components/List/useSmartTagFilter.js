import { useSearchParams } from "react-router-dom";
import { buildFetchOptions } from "../../hooks/utils/useColumnFilters";

export function useSmartUrlParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedTagIdsParam = searchParams.get("selectedTagIds") || "";
  const tagFilterMode = searchParams.get("tagFilterMode") || "OR";
  const searchQuery = searchParams.get("q") || "";
  const textCondition = searchParams.get("qf") || "";
  const selectedTagIds = selectedTagIdsParam ? selectedTagIdsParam.split(",") : [];

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    setSearchParams(next);
  };

  const updateParams = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next);
  };

  return { selectedTagIdsParam, tagFilterMode, searchQuery, textCondition, selectedTagIds, updateParam, updateParams };
}

/**
 * Hook for pages to get queryOptions from SmartSearch URL state.
 * Pass query + headerColumns to get a ready-to-use PocketBase options object.
 *
 * @param {Object} [options]
 * @param {string} [options.tagsField="tags"]  - PocketBase relation field for tags
 * @param {Object} [options.query]             - Sort/filter state from ListView
 * @param {Array}  [options.headerColumns]     - Column definitions
 * @param {Object} [options.baseOptions]       - Fixed PocketBase options (e.g. { expand: "..." })
 */
export function useSmartTagFilter({ tagsField = "tags", query, headerColumns, baseOptions, extraConditions = [] } = {}) {
  const { selectedTagIdsParam, tagFilterMode, textCondition, selectedTagIds } = useSmartUrlParams();

  const tagConditions =
    selectedTagIds.length === 0
      ? []
      : tagFilterMode === "OR"
        ? [`(${selectedTagIds.map((id) => `${tagsField} ?~ "${id}"`).join(" || ")})`]
        : selectedTagIds.map((id) => `${tagsField} ?~ "${id}"`);

  const allConditions = [...tagConditions, ...(textCondition ? [textCondition] : []), ...extraConditions];
  const conditionsKey = `${selectedTagIdsParam}|${tagFilterMode}|${textCondition}`;
  const queryOptions =
    query && headerColumns ? buildFetchOptions(query, headerColumns, baseOptions || {}, allConditions) : undefined;

  return { tagConditions: allConditions, conditionsKey, queryOptions };
}
