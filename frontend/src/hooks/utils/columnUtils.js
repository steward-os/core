/**
 * Gets the filter key for a column
 * @param {Object} column - Column definition
 * @returns {string|null} The key to use for filtering
 */
export function getColumnFilterKey(column) {
  if (!column) return null;
  
  if (typeof column.filter === 'string') {
    return column.filter;
  } else if (typeof column.filter === 'function') {
    return column.field; // Use field as key for function filters
  }
  return null;
}