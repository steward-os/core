import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars3Icon, TrashIcon } from "@heroicons/react/24/outline";
import { parseFieldsJson } from "../../utils/mjmlUtils";
import { resolveSmartType } from "./smartBlockRenderers";
import BlockField from "./BlockField";

const SortableBlock = ({ mailingBlock, blockDef, onRemove, onContentChange, mailingId }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mailingBlock.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const smartType = resolveSmartType(blockDef);
  const fields = parseFieldsJson(blockDef?.fields);
  const content = mailingBlock.content ?? {};

  return (
    <div ref={setNodeRef} style={style} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 touch-none"
        >
          <Bars3Icon className="h-4 w-4" />
        </button>
        <span className="flex-1 text-sm font-medium text-gray-700 dark:text-gray-300">
          {blockDef?.name ?? "Onbekend blok"}
        </span>
        <button
          onClick={() => onRemove(mailingBlock.id)}
          className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {smartType && (
        <p className="px-4 py-3 text-xs text-blue-600 dark:text-blue-400 italic">
          Smart blok — haalt automatisch data op bij compilatie.
        </p>
      )}
      {!smartType && fields.length === 0 && (
        <p className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 italic">Dit blok heeft geen velden.</p>
      )}
      {fields.length > 0 && (
        <div className="px-4 py-3 space-y-3">
          {fields.map((field) => (
            <BlockField
              key={field.id}
              field={field}
              value={content[field.id] ?? ""}
              onChange={(val) => onContentChange(mailingBlock.id, field.id, val)}
              mailingId={mailingId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SortableBlock;
