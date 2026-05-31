import { PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { SortableItem } from "../../components/DragAndDrop/SortableItem";
import { SortableList } from "../../components/DragAndDrop/SortableList";
import { EditButton } from "../../components/Button/EditButton";
import { DeleteButton } from "../../components/Button/DeleteButton";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import RemarksIndicator from "../../components/Remarks/RemarksIndicator";

const MeetingTopicsTable = ({ topics, selectedRowKeys, setSelectedRowKeys, onUpdate, onReorder, onEdit, onDelete, onClick }) => {
  const getStateColorClass = (state) => {
    switch (state) {
      case "open":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "done":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStateLabel = (state) => {
    switch (state) {
      case "open":
        return "Open";
      case "discussed":
        return "Besproken";
      default:
        return state;
    }
  };

  const handleRowSelect = (recordId) => {
    const newSelectedKeys = selectedRowKeys.includes(recordId)
      ? selectedRowKeys.filter((key) => key !== recordId)
      : [...selectedRowKeys, recordId];
    setSelectedRowKeys(newSelectedKeys);
  };

  const handleSelectAll = () => {
    const allKeys = topics.map((record) => record.id);
    const allSelected = allKeys.every((key) => selectedRowKeys.includes(key));
    setSelectedRowKeys(allSelected ? [] : allKeys);
  };

  const isAllSelected = topics.length > 0 && topics.every((record) => selectedRowKeys.includes(record.id));
  const isIndeterminate = selectedRowKeys.length > 0 && !isAllSelected;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = topics.findIndex((topic) => topic.id === active.id);
      const newIndex = topics.findIndex((topic) => topic.id === over.id);

      const newTopics = arrayMove(topics, oldIndex, newIndex);
      onReorder(newTopics);
    }
  };

  return (
    <div className="w-full max-w-full">
      {/* Header */}
      <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 py-3 min-w-max">
        <div className="w-12 flex justify-center">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(input) => {
              if (input) input.indeterminate = isIndeterminate;
            }}
            onChange={handleSelectAll}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
        </div>
        <div className="min-w-32 flex-1 px-4 text-left  font-medium text-gray-700 dark:text-gray-300">Naam</div>
        <div className="w-20 px-4 text-left  font-medium text-gray-700 dark:text-gray-300">
          <ChatBubbleLeftIcon className="w-4 h-4" title="Opmerkingen" />
        </div>
        <div className="w-24 px-4 text-left  font-medium text-gray-700 dark:text-gray-300">Status</div>
        <div className="w-24 px-4 text-left  font-medium text-gray-700 dark:text-gray-300">Acties</div>
        <div className="w-8"></div>
      </div>

      {/* Sortable List */}
      <SortableList
        items={topics}
        sensors={sensors}
        onDragEnd={handleDragEnd}
        className="bg-white divide-y divide-gray-200"
      >
        {topics.map((topic) => {
          const isSelected = selectedRowKeys.includes(topic.id);

          return (
            <SortableItem key={topic.id} id={topic.id} dragHandle={true} dragHandlePosition="right" className="w-full">
              <div
                className={`flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full ${
                  isSelected ? "bg-blue-50" : ""
                } ${onClick ? "cursor-pointer" : ""}`}
                onClick={() => onClick?.(topic)}
              >
                <div className="w-12 flex justify-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleRowSelect(topic.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>
                <div className="flex-1 px-4  text-gray-900">{topic.name || "-"}</div>
                <div className="w-20 px-4">
                  <RemarksIndicator entityId={topic.id} entityType="meeting_topic" />
                </div>
                <div className="w-24 px-4">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStateColorClass(
                      topic.state
                    )}`}
                  >
                    {getStateLabel(topic.state)}
                  </span>
                </div>
                <div className="w-24 px-4 flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <EditButton 
                    onClick={() => onEdit?.(topic)} 
                    ariaLabel={`Bewerk ${topic.name}`}
                  />
                  <DeleteButton 
                    onClick={() => onDelete?.(topic)} 
                    ariaLabel={`Verwijder ${topic.name}`}
                  />
                </div>
              </div>
            </SortableItem>
          );
        })}
      </SortableList>

      {topics.length === 0 && <div className="text-center py-8 text-gray-500">Geen agendapunten gevonden.</div>}
    </div>
  );
};

export default MeetingTopicsTable;
