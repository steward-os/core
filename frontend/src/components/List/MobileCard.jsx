import AnchoredMenu from "../AnchoredMenu";
import { DeleteButton, DuplicateButton, EditButton } from "../Button";
import { getColumnContent } from "./columnContent";

const MobileCard = ({ item, headerColumns, onClick, onEdit, onDelete, onDuplicate, renderFooter }) => {
  const hasActions = onEdit || onDelete || onDuplicate;

  const handleRowClick = onClick ? () => onClick(item) : undefined;

  const titleColumns = headerColumns.filter((col) => col.mobilePosition === "title");
  const rightColumns = headerColumns.filter((col) => col.mobilePosition === "right");
  const infoColumns = headerColumns.filter((col) => col.mobilePosition === "info");

  return (
    <div
      className={`glass-panel rounded-2xl p-5 md:hidden transition-all duration-200 ${onClick ? "cursor-pointer hover:bg-white/80 dark:hover:bg-white/10 active:scale-[0.98]" : ""
        }`}
      onClick={handleRowClick}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          {titleColumns.map((column, index) => (
            <h3 key={index} className="font-medium text-base text-[var(--text-primary)] mb-1">
              {getColumnContent(column, item)}
            </h3>
          ))}

          {infoColumns.length > 0 && (
            <div className="space-y-0.5">
              {infoColumns.map((column, index) => (
                <div key={index} className="text-sm text-[var(--text-secondary)]">
                  {getColumnContent(column, item)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex items-start gap-2">
          {rightColumns.length > 0 && (
            <>
              {rightColumns.map((column, index) => {
                const content = getColumnContent(column, item);
                return content ? <div key={index}>{content}</div> : null;
              })}
            </>
          )}

          {hasActions && (
            <AnchoredMenu>
              {({ close }) => (
                <>
                  {onDuplicate && (
                    <DuplicateButton
                      size="normal"
                      showText
                      className="w-full justify-start hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-lg transition-colors"
                      onClick={(e) => { e.stopPropagation(); close(); onDuplicate(item); }}
                    />
                  )}
                  {onEdit && (
                    <EditButton
                      size="normal"
                      showText
                      className="w-full justify-start hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-lg transition-colors"
                      onClick={(e) => { e.stopPropagation(); close(); onEdit(item); }}
                    />
                  )}
                  {onDelete && (
                    <DeleteButton
                      size="normal"
                      showText
                      className="w-full justify-start hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-lg transition-colors text-red-600"
                      onClick={(e) => { e.stopPropagation(); close(); onDelete(item.id); }}
                    />
                  )}
                </>
              )}
            </AnchoredMenu>
          )}
        </div>
      </div>
      {renderFooter?.(item)}
    </div>
  );
};

export default MobileCard;
