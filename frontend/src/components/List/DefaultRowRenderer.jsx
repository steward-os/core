import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import ActionButtons from "./ActionButtons";
import { getColumnContent } from "./columnContent";
import { ListRow } from "./ListRow";
import MobileCard from "./MobileCard";

const DefaultRowRenderer = ({
  item,
  headerColumns,
  onClick,
  onEdit,
  onDelete,
  onDuplicate,
  onQuickEdit,
  enableSelection,
  isSelected,
  onToggleSelection,
  renderFooter,
  hideCategories,
  renderHoverTooltip,
}) => {
  const [tooltipPos, setTooltipPos] = useState(null);
  const moveTimerRef = useRef(null);
  const handleRowClick = onClick ? () => onClick(item) : undefined;
  const tooltipContent = renderHoverTooltip?.(item);
  const mouseProps = tooltipContent
    ? {
        onMouseEnter: (e) => {
          clearTimeout(moveTimerRef.current);
          moveTimerRef.current = setTimeout(() => setTooltipPos({ x: e.clientX, y: e.clientY }), 400);
        },
        onMouseLeave: () => {
          clearTimeout(moveTimerRef.current);
          setTooltipPos(null);
        },
        onMouseMove: (e) => {
          clearTimeout(moveTimerRef.current);
          setTooltipPos(null);
          const { clientX, clientY } = e;
          moveTimerRef.current = setTimeout(() => setTooltipPos({ x: clientX, y: clientY }), 400);
        },
      }
    : {};

  const hasActionHandlers = !!(onEdit || onDelete || onDuplicate || onQuickEdit);

  const desktopColumns = headerColumns.map((column) => {
    if (enableSelection && column.isSelectionColumn) {
      return {
        content: (
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={() => onToggleSelection && onToggleSelection(item.id)}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        ),
        width: column.width,
        className: "flex justify-center",
      };
    }

    if (hideCategories && column.category) {
      return { content: null, width: column.width, className: column.className || "" };
    }

    return {
      content: getColumnContent(column, item),
      width: column.width,
      className: column.className || "",
    };
  });

  if (hasActionHandlers) {
    desktopColumns.push({
      content: <ActionButtons item={item} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} onQuickEdit={onQuickEdit} />,
      className: "flex justify-end",
    });
  }

  return (
    <>
      <div className="hidden md:block">
        <ListRow onClick={handleRowClick} columns={desktopColumns} {...mouseProps} />
      </div>
      <MobileCard
        item={item}
        headerColumns={headerColumns}
        onClick={onClick}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        renderFooter={renderFooter}
      />
      {tooltipPos && tooltipContent &&
        createPortal(
          <div
            style={{ position: "fixed", left: tooltipPos.x + 12, top: tooltipPos.y - 40, zIndex: 9999 }}
            className="pointer-events-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-white/10 rounded-lg shadow-lg px-3 py-2 flex flex-wrap gap-1 max-w-xs"
          >
            {tooltipContent}
          </div>,
          document.body
        )}
    </>
  );
};

export default DefaultRowRenderer;
