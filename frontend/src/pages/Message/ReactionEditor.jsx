import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Bars2Icon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef } from "react";
import { REACTION_PRESETS, changeReactionRow, reactionRowsFrom } from "../../utils/messageUtils";

/**
 * One button's text in a pill, the shape members will tap. The empty row at the end shows a + instead
 * of the drag handle, and no ✕. Every row is this same component, so typing in the empty row (which
 * turns it into a button with the same key) keeps the cursor in it.
 */
const ReactionRow = ({ row, isNew, disabled, inputRef, onChange, onRemove }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.key, disabled: isNew || disabled });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 ${isDragging ? "relative z-10 opacity-80" : ""}`}
    >
      {isNew ? (
        <span className="w-8 flex justify-center text-[var(--text-secondary)]">
          <PlusIcon className="w-5 h-5" />
        </span>
      ) : (
        <button
          type="button"
          className="w-8 flex justify-center text-[var(--text-secondary)] cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }}
          aria-label={`${row.text} verplaatsen`}
          {...attributes}
          {...listeners}
        >
          <Bars2Icon className="w-5 h-5" />
        </button>
      )}
      <input
        ref={inputRef}
        type="text"
        value={row.text}
        maxLength={100}
        disabled={disabled}
        placeholder={isNew ? "Knop toevoegen…" : undefined}
        onChange={(e) => onChange(row.key, e.target.value)}
        className="flex-1 min-w-0 px-4 py-2.5 rounded-full border border-[var(--text-secondary)]/40 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      {isNew ? (
        <span className="w-9" />
      ) : (
        <button
          type="button"
          onClick={() => onRemove(row.key)}
          disabled={disabled}
          className="p-2 rounded-full text-[var(--text-secondary)] hover:text-red-500 hover:bg-black/5 dark:hover:bg-white/10"
          aria-label={`${row.text} verwijderen`}
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

/**
 * The reaction buttons under the message, edited like a poll's answers (see changeReactionRow): an
 * empty row at the end becomes a new button as soon as something is typed, the handle drags rows into
 * order and ✕ removes one. With two or more buttons, members get one choice or several.
 *
 * [value] is { rows, newKey, nextKey }; [focusRequest] goes up on every "Reactie vragen".
 */
const ReactionEditor = ({ value, onChange, allowMultiple, onAllowMultipleChange, onClear, disabled, focusRequest }) => {
  const newRowRef = useRef(null);
  const sensors = useSensors(
    useSensor(TouchSensor),
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (focusRequest > 0) newRowRef.current?.focus();
  }, [focusRequest]);

  const { rows, newKey } = value;
  const filled = rows.filter((row) => row.text.trim()).length;
  const pending = { key: newKey, text: "" };

  const handleChange = (key, text) => {
    if (key === newKey && !text) return;
    onChange(changeReactionRow(value, key, text));
  };
  const handleRemove = (key) => onChange({ ...value, rows: rows.filter((row) => row.key !== key) });
  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const from = rows.findIndex((row) => row.key === active.id);
    const to = rows.findIndex((row) => row.key === over.id);
    if (from !== -1 && to !== -1) onChange({ ...value, rows: arrayMove(rows, from, to) });
  };
  const choiceButton = (selected) =>
    `flex-1 px-3 py-2 text-sm font-medium transition-colors ${selected ? "bg-blue-600 text-white" : "text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"}`;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center">
        <h3 className="flex-1 text-sm font-semibold text-blue-600 dark:text-blue-400">Reactieknoppen</h3>
        <button type="button" onClick={onClear} disabled={disabled} className="px-2 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
          Weghalen
        </button>
      </div>
      <p className="-mt-2 text-xs text-[var(--text-secondary)]">Leden reageren met één tik op een knop onder je bericht.</p>

      {filled === 0 && (
        <div className="flex flex-wrap gap-2">
          {REACTION_PRESETS.map((preset) => (
            <button
              key={preset.join("/")}
              type="button"
              disabled={disabled}
              onClick={() => onChange(reactionRowsFrom(preset))}
              className="px-3 py-1.5 rounded-lg border border-[var(--text-secondary)]/40 text-sm text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
            >
              {preset.join(" / ")}
            </button>
          ))}
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis, restrictToParentElement]}>
        <SortableContext items={rows.map((row) => row.key)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {[...rows, pending].map((row) => (
              <ReactionRow
                key={row.key}
                row={row}
                isNew={row.key === newKey}
                disabled={disabled}
                inputRef={row.key === newKey ? newRowRef : undefined}
                onChange={handleChange}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {filled >= 2 && (
        <div className="flex rounded-full border border-[var(--text-secondary)]/40 overflow-hidden" role="radiogroup" aria-label="Aantal keuzes">
          <button type="button" role="radio" aria-checked={!allowMultiple} disabled={disabled} onClick={() => onAllowMultipleChange(false)} className={choiceButton(!allowMultiple)}>
            Eén keuze
          </button>
          <button type="button" role="radio" aria-checked={allowMultiple} disabled={disabled} onClick={() => onAllowMultipleChange(true)} className={choiceButton(allowMultiple)}>
            Meerdere keuzes
          </button>
        </div>
      )}
    </section>
  );
};

export default ReactionEditor;
