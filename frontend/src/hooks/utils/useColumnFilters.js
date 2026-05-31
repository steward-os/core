/**
 * Converts table sort/filter state into PocketBase fetch options.
 * @param {{ sortField, sortDirection, filters }} tableState - Current sort and filter state from ListView
 * @param {Array} headerColumns - Column definitions (passed to buildColumnFilterConditions)
 * @param {Object} baseOptions - Fixed options to merge in (e.g. { expand: "..." })
 * @param {string[]} extraFilterConditions - Additional PocketBase filter strings to AND in (e.g. time-range or tag filters)
 * @returns {Object} PocketBase fetch options with sort and optional filter
 */
export function buildFetchOptions(tableState, headerColumns, baseOptions = {}, extraFilterConditions = []) {
  const sort = tableState.sortDirection === "desc" ? `-${tableState.sortField}` : tableState.sortField;

  const filterConditions = [
    ...extraFilterConditions,
    ...buildColumnFilterConditions(tableState.filters, headerColumns),
  ];

  return {
    ...baseOptions,
    sort,
    ...(filterConditions.length > 0 && { filter: filterConditions.join(" && ") }),
  };
}

/**
 * Builds filter conditions from column-based filters
 * @param {Object} filters - Filter values by filter key
 * @param {Array} headerColumns - Column definitions with filter property (string or function)
 * @returns {Array} Array of filter condition strings
 */
export function buildColumnFilterConditions(filters, headerColumns) {
  const conditions = [];
  
  Object.entries(filters).forEach(([filterKey, value]) => {
    if (value && value.trim()) {
      const column = headerColumns.find(col => col.filter === filterKey || 
        (typeof col.filter === 'function' && col.field === filterKey));
      
      if (column && column.filter) {
        if (typeof column.filter === 'function') {
          conditions.push(column.filter(value));
        } else {
          // column.filter is a string (field name)
          conditions.push(`${column.filter} ~ "${value}"`);
        }
      }
    }
  });
  
  return conditions;
}