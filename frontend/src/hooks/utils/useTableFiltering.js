import { useState, useCallback } from 'react';

export const useTableFiltering = (initialColumns = []) => {
  const [headerColumns, setHeaderColumns] = useState(initialColumns);

  const handleFilterChange = useCallback((value, field, onFilterChange) => {
    const updatedColumns = headerColumns.map(col => 
      col.field === field ? { ...col, filterValue: value } : col
    );
    setHeaderColumns(updatedColumns);
    
    if (onFilterChange) {
      onFilterChange(updatedColumns);
    }
  }, [headerColumns]);

  const clearAllFilters = useCallback((onFilterChange) => {
    const clearedColumns = headerColumns.map(col => ({
      ...col,
      filterValue: ""
    }));
    setHeaderColumns(clearedColumns);
    
    if (onFilterChange) {
      onFilterChange(clearedColumns);
    }
  }, [headerColumns]);

  const getActiveFilters = useCallback(() => {
    return headerColumns.filter(col => col.filterable && col.filterValue);
  }, [headerColumns]);

  return {
    headerColumns,
    setHeaderColumns,
    handleFilterChange,
    clearAllFilters,
    getActiveFilters
  };
};