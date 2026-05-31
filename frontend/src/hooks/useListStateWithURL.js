import { useSearchParams } from 'react-router-dom';

/**
 * Hook for managing list sorting and filtering state with URL persistence
 * @param {string} initialSortField - Initial sort field
 * @param {string} initialSortDirection - Initial sort direction ('asc' or 'desc')
 * @returns {Object} State and handlers for sorting and filtering
 */
export function useListStateWithURL(initialSortField = null, initialSortDirection = 'asc') {
  const [searchParams, setSearchParams] = useSearchParams();

  // Get state from URL or use defaults
  const sortField = searchParams.get('sortField') || initialSortField;
  const sortDirection = searchParams.get('sortDirection') || initialSortDirection;

  // Parse filters from URL (stored as JSON string)
  const filtersParam = searchParams.get('filters');
  const filters = filtersParam ? JSON.parse(filtersParam) : {};

  // Sort handler
  const handleSort = (field, direction) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sortField', field);
    newParams.set('sortDirection', direction);
    setSearchParams(newParams);
  };

  // Filter handler
  const handleFilterChange = (newFilters) => {
    const newParams = new URLSearchParams(searchParams);
    if (Object.keys(newFilters).length > 0) {
      newParams.set('filters', JSON.stringify(newFilters));
    } else {
      newParams.delete('filters');
    }
    setSearchParams(newParams);
  };

  return {
    // State
    sortField,
    sortDirection,
    filters,
    // Handlers
    handleSort,
    handleFilterChange
  };
}
