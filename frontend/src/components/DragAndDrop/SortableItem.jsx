import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export const SortableItem = ({
  id,
  children,
  className = "",
  dragHandle = true,
  dragHandleProps = {},
  disabled = false,
  dragHandlePosition = "right"
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Support render props pattern for custom drag handle
  if (dragHandlePosition === "inside" && typeof children === 'function') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={className}
      >
        {children({ ...listeners, ...dragHandleProps })}
      </div>
    );
  }

  const itemProps = dragHandle ? { ...attributes } : { ...attributes, ...listeners };
  const itemClassName = `${className} ${!dragHandle && !disabled ? 'cursor-move' : ''}`;

  const dragHandleElement = dragHandle && !disabled && (
    <div
      className={`absolute ${dragHandlePosition === "left" ? "left-2" : "right-2"} top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 text-gray-400 select-none cursor-move hover:text-gray-600 z-10`}
      style={{ touchAction: 'none' }}
      {...listeners}
      {...dragHandleProps}
    >
      ⋮⋮
    </div>
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...itemProps}
      className={`${itemClassName} relative`}
    >
      {dragHandleElement}
      <div className={`${dragHandlePosition === "left" ? "pl-8" : "pr-8"}`}>
        {children}
      </div>
    </div>
  );
};