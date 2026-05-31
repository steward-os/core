import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import { useSelection } from "../../hooks/useSelection";
import DefaultRowRenderer from "./DefaultRowRenderer";
import { FlexHeader } from "./FlexHeader";
import { EmptyListMessage } from "./ListContainer";
import MobileFilters from "./MobileFilters";
import { getNestedValue } from "./columnContent";

// --- Grouping helpers ---

function parseCategorySort(value, fallbackField) {
  if (!value) return null;
  const [first, second] = value.trim().split(/\s+/);
  if (second === "asc" || second === "desc") return { field: first, direction: second };
  if (first === "asc" || first === "desc") return { field: fallbackField, direction: first };
  return { field: first, direction: "asc" };
}

function resolveField(row, field) {
  const direct = getNestedValue(row, field);
  if (direct != null) return direct;
  if (field.includes(".")) return getNestedValue(row, "expand." + field) ?? undefined;
  return undefined;
}

function buildGroups(data, categoryColumn) {
  const sortSpec = parseCategorySort(categoryColumn.categorySort, categoryColumn.field)
    ?? { field: categoryColumn.field, direction: "asc" };

  const sorted = [...data].sort((a, b) => {
    const va = String(resolveField(a, sortSpec.field) ?? "");
    const vb = String(resolveField(b, sortSpec.field) ?? "");
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sortSpec.direction === "desc" ? -cmp : cmp;
  });

  const groupMap = new Map();
  for (const row of sorted) {
    const raw = categoryColumn.render ? categoryColumn.render(row) : (resolveField(row, categoryColumn.field) ?? "");
    if (raw === null) continue;
    const key = String(raw ?? "");
    if (!groupMap.has(key)) groupMap.set(key, { key, rows: [] });
    groupMap.get(key).rows.push(row);
  }
  return Array.from(groupMap.values());
}

// --- Group header row ---

function GroupHeaderRow({ label, expanded, onToggle }) {
  const Icon = expanded ? ChevronDownIcon : ChevronRightIcon;
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-2 px-4 py-2 bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.07] text-sm font-semibold text-[var(--text-secondary)] transition-colors"
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label || "—"}</span>
    </button>
  );
}

// --- ListView ---

export const ListView = ({
  data = [],
  totalItems = 0, // eslint-disable-line no-unused-vars
  headerColumns,
  renderItem,
  emptyMessage = "Geen items gevonden.",
  className = "",
  defaultSortField = null,
  defaultSortDirection = "asc",
  onClick,
  onEdit,
  onDelete,
  onDuplicate,
  onQuickEdit,
  onQueryChange,
  enableSelection = false,
  onBulkDelete,
  bulkDeleteText = "Verwijder geselecteerde",
  renderBulkActions,
  filterText, // eslint-disable-line no-unused-vars
  filterRow,
  renderFooter,
  renderHoverTooltip,
  headerType = "default",
}) => {
  const selection = useSelection(data, "id");
  const [sortField, setSortField] = useState(defaultSortField);
  const [sortDirection, setSortDirection] = useState(defaultSortDirection);
  const [filters, setFilters] = useState({});
  const [groupOverrides, setGroupOverrides] = useState(new Set());

  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);
    onQueryChange?.({ sortField: field, sortDirection: newDirection, filters });
  };

  const handleFilterApply = (value, field) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onQueryChange?.({ sortField, sortDirection, filters: newFilters });
  };

  const handleClearAllFilters = () => {
    setFilters({});
    onQueryChange?.({ sortField, sortDirection, filters: {} });
  };

  const handleBulkDelete = async () => {
    if (selection.selectedCount === 0) return;
    if (window.confirm(`Weet je zeker dat je ${selection.selectedCount} item(s) wilt verwijderen?`)) {
      try {
        await onBulkDelete(selection.selectedIds);
        selection.clearSelection();
      } catch (error) {
        console.error("Error during bulk delete:", error);
      }
    }
  };

  const toggleGroup = (key) =>
    setGroupOverrides((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // Build columns (add filter values + optional selection/action columns)
  let columns = headerColumns?.map((col) => ({ ...col, filterValue: filters[col.field] })) || [];
  if (enableSelection) {
    columns = [
      {
        label: (
          <input
            type="checkbox"
            checked={selection.isAllSelected}
            ref={(el) => { if (el) el.indeterminate = selection.isIndeterminate; }}
            onChange={selection.toggleSelectAll}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        ),
        width: "48px",
        sortable: false,
        isSelectionColumn: true,
        className: "flex justify-center",
      },
      ...columns,
    ];
  }

  if (onEdit || onDelete || onDuplicate || onQuickEdit) {
    columns = [...columns, { label: "", sortable: false }];
  }

  // Build groups if a category column is defined
  const categoryColumn = headerColumns?.find((c) => c.category && c.field);
  const groups = categoryColumn ? buildGroups(data, categoryColumn) : null;
  const categoryDefault = categoryColumn?.category; // "expanded" | "collapsed"

  const isGroupExpanded = (key) => {
    const overridden = groupOverrides.has(key);
    return categoryDefault === "collapsed" ? overridden : !overridden;
  };

  // Flat list of entries to render
  const entries = groups
    ? groups.flatMap((group) => {
        const expanded = isGroupExpanded(group.key);
        return [
          { type: "group-header", key: `group-${group.key}`, label: group.key, expanded, groupKey: group.key },
          ...(expanded ? group.rows.map((item) => ({ type: "row", key: item.id, item })) : []),
        ];
      })
    : data.map((item) => ({ type: "row", key: item.id, item }));

  const RowRenderer = renderItem || DefaultRowRenderer;

  const renderRow = (item) => (
    <RowRenderer
      item={item}
      headerColumns={columns}
      onClick={onClick}
      onEdit={onEdit}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
      onQuickEdit={onQuickEdit}
      enableSelection={enableSelection}
      isSelected={selection.isSelected(item.id)}
      onToggleSelection={selection.toggleItem}
      renderFooter={renderFooter}
      renderHoverTooltip={renderHoverTooltip}
      hideCategories={!!groups}
    />
  );

  return (
    <>
      {filterRow && <div className="hidden md:block mb-3 md:ml-3 md:mb-4">{filterRow}</div>}
      <div className={`md:glass-panel md:rounded-xl md:shadow-sm md:overflow-hidden transition-all duration-300 ${className}`}>

        {enableSelection && selection.selectedCount > 0 && (
          <div className="bg-blue-500/10 dark:bg-blue-500/20 backdrop-blur-sm border-b border-blue-500/20 px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
              {selection.selectedCount} item(s) geselecteerd
            </span>
            <div className="flex gap-2">
              {renderBulkActions?.(Array.from(selection.selectedIds), selection.clearSelection)}
              {onBulkDelete && (
                <button onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  {bulkDeleteText}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="hidden md:block">
          <FlexHeader columns={columns} onSortClick={handleSort} sortField={sortField} sortDirection={sortDirection} onFilterApply={handleFilterApply} filters={filters} headerType={headerType} />
        </div>

        <div className="flex items-center justify-between px-4 mb-4 mt-2 gap-2">
          <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar py-1 md:hidden">{filterRow}</div>
          <MobileFilters headerColumns={headerColumns} filters={filters} onFilterApply={handleFilterApply} onClearAllFilters={handleClearAllFilters} />
        </div>

        {entries.length === 0 ? (
          <EmptyListMessage>{emptyMessage}</EmptyListMessage>
        ) : (
          <div className="space-y-3 md:space-y-0 md:divide-y md:divide-gray-200 md:dark:divide-white/10">
            {entries.map((entry) =>
              entry.type === "group-header" ? (
                <GroupHeaderRow key={entry.key} label={entry.label} expanded={entry.expanded} onToggle={() => toggleGroup(entry.groupKey)} />
              ) : (
                <div key={entry.key}>{renderRow(entry.item)}</div>
              )
            )}
          </div>
        )}

      </div>
    </>
  );
};
