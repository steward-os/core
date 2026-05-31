import { useState, useCallback } from 'react';

export const usePagination = (initialPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(initialPerPage);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const goToPage = useCallback((page, onPageChange) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      if (onPageChange) {
        onPageChange(page);
      }
    }
  }, [totalPages]);

  const goToNextPage = useCallback((onPageChange) => {
    if (currentPage < totalPages) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      if (onPageChange) {
        onPageChange(nextPage);
      }
    }
  }, [currentPage, totalPages]);

  const goToPreviousPage = useCallback((onPageChange) => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      if (onPageChange) {
        onPageChange(prevPage);
      }
    }
  }, [currentPage]);

  const resetToFirstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const updatePaginationData = useCallback((items, totalItemsCount, totalPagesCount) => {
    setTotalItems(totalItemsCount);
    setTotalPages(totalPagesCount);
    
    // Reset to page 1 if current page is beyond available pages
    if (currentPage > totalPagesCount && totalPagesCount > 0) {
      setCurrentPage(1);
      return true; // Indicates page was reset
    }
    return false;
  }, [currentPage]);

  return {
    currentPage,
    perPage,
    totalItems,
    totalPages,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    resetToFirstPage,
    updatePaginationData
  };
};