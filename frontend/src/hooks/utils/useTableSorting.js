import { useState, useCallback } from 'react';

export const useTableSorting = (initialField = "", initialDirection = "asc") => {
  const [sortField, setSortField] = useState(initialField);
  const [sortDirection, setSortDirection] = useState(initialDirection);

  const handleSortChange = useCallback((field, direction, onSortChange) => {
    setSortField(field);
    setSortDirection(direction);
    
    if (onSortChange) {
      onSortChange(field, direction);
    }
  }, []);

  const toggleSort = useCallback((field, onSortChange) => {
    const newDirection = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    handleSortChange(field, newDirection, onSortChange);
  }, [sortField, sortDirection, handleSortChange]);

  const getSortParams = useCallback(() => {
    return { field: sortField, direction: sortDirection };
  }, [sortField, sortDirection]);

  const formatSortForPocketBase = useCallback((field = sortField, direction = sortDirection) => {
    return direction === "desc" ? `-${field}` : field;
  }, [sortField, sortDirection]);

  return {
    sortField,
    sortDirection,
    handleSortChange,
    toggleSort,
    getSortParams,
    formatSortForPocketBase
  };
};