import { useSensors, useSensor, PointerSensor, KeyboardSensor, TouchSensor } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export const useDragAndDrop = ({ 
  items, 
  setItems, 
  updateOrder, // async function to update backend
  getItemId = (item) => item.id 
}) => {
  const sensors = useSensors(
    useSensor(TouchSensor),
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex(item => getItemId(item) === active.id);
    const newIndex = items.findIndex(item => getItemId(item) === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = arrayMove(items, oldIndex, newIndex);
    setItems(newItems);

    try {
      if (updateOrder) {
        await updateOrder(newItems);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      setItems(items); // Revert on error
    }
  };

  return { sensors, handleDragEnd };
};