import React from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';

export const SortableList = ({
  items,
  sensors,
  onDragEnd,
  children,
  strategy = verticalListSortingStrategy,
  className = "",
  getItemId = (item) => item.id
}) => {
  const itemIds = Array.isArray(items) ? items.map(getItemId) : [];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext items={itemIds} strategy={strategy}>
        <div className={className}>
          {children}
        </div>
      </SortableContext>
    </DndContext>
  );
};