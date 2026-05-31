import { useState, useCallback, useMemo } from "react";

/**
 * Hook for managing item selection in lists with support for:
 * - Individual item selection/deselection
 * - Select all/none functionality
 * - Bulk operations on selected items
 *
 * @param {Array} items - Array of items that can be selected
 * @param {string} idField - Field to use as unique identifier (default: 'id')
 * @returns {Object} Selection state and handlers
 */
export const useSelection = (items = [], idField = "id") => {
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Get actual selected items (not just IDs)
  const selectedItems = useMemo(() => {
    return items.filter((item) => selectedIds.has(item[idField]));
  }, [items, selectedIds, idField]);

  // Check if all items are selected
  const isAllSelected = useMemo(() => {
    return items.length > 0 && items.every((item) => selectedIds.has(item[idField]));
  }, [items, selectedIds, idField]);

  // Check if some (but not all) items are selected
  const isIndeterminate = useMemo(() => {
    const selectedCount = selectedItems.length;
    return selectedCount > 0 && selectedCount < items.length;
  }, [selectedItems.length, items.length]);

  // Toggle selection of individual item
  const toggleItem = useCallback(
    (itemId) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
    },
    []
  );

  // Select all items
  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map((item) => item[idField])));
  }, [items, idField]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Toggle select all (select all if none/some selected, clear if all selected)
  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAll();
    }
  }, [isAllSelected, clearSelection, selectAll]);

  // Check if specific item is selected
  const isSelected = useCallback(
    (itemId) => {
      return selectedIds.has(itemId);
    },
    [selectedIds]
  );

  // Remove items from selection (useful after deletion)
  const removeFromSelection = useCallback((itemIds) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      itemIds.forEach((id) => newSet.delete(id));
      return newSet;
    });
  }, []);

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedItems.length,
    isAllSelected,
    isIndeterminate,
    isSelected,
    toggleItem,
    selectAll,
    clearSelection,
    toggleSelectAll,
    removeFromSelection,
  };
};