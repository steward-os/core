import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { DeleteButton, DuplicateButton, EditButton } from "../Button";
import { RowButtons } from "./ListRow";

/**
 * Renders edit/duplicate/delete action buttons for a list row.
 * variant="desktop" wraps in RowButtons (inline, no border).
 * variant="mobile"  wraps in a bordered footer strip.
 */
const ActionButtons = ({ item, onEdit, onDelete, onDuplicate, onQuickEdit, variant = "desktop" }) => {
  if (!onEdit && !onDelete && !onDuplicate && !onQuickEdit) return null;

  const buttons = (
    <>
      {onQuickEdit && (
        <button
          onClick={(e) => { e.stopPropagation(); onQuickEdit(item); }}
          title="Snel bewerken"
          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
        >
          <PencilSquareIcon className="h-4 w-4" />
        </button>
      )}
      {onDuplicate && (
        <DuplicateButton onClick={(e) => { e.stopPropagation(); onDuplicate(item); }} />
      )}
      {onEdit && (
        <EditButton onClick={(e) => { e.stopPropagation(); onEdit(item); }} />
      )}
      {onDelete && (
        <DeleteButton onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} />
      )}
    </>
  );

  if (variant === "mobile") {
    return (
      <div className="flex justify-end space-x-2 pt-3 mt-3 border-t border-[var(--glass-border)]">
        {buttons}
      </div>
    );
  }

  return <RowButtons>{buttons}</RowButtons>;
};

export default ActionButtons;
