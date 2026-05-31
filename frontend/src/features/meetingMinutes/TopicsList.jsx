import { DocumentTextIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import { AddButton } from "../../components/Button";
import { SortableItem } from "../../components/DragAndDrop/SortableItem";
import { SortableList } from "../../components/DragAndDrop/SortableList";
import DialogPanel from "../../components/Modal/DialogPanel";
import RemarksIndicator from "../../components/Remarks/RemarksIndicator";
import pb from "../../pb";
import EditMeetingTopicDialog from "../meetings/EditMeetingTopicDialog";
import MinutesList from "./MinutesList";

const TopicsList = React.memo(({ topicsHook, meetingId, minutesHook, currentMinutes, onEditMinute }) => {
  const { topics, selectedTopic, selectTopic, sensors, handleDragEnd, refresh } = topicsHook;
  const [topicToView, setTopicToView] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [minutesModalOpen, setMinutesModalOpen] = useState(false);

  const handleOpenTopic = (topic) => {
    selectTopic(topic);
    setTopicToView(topic);
    setEditDialogOpen(true);
  };

  const handleNewTopic = () => {
    setTopicToView(null);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setTopicToView(null);
  };

  const handleTopicSaved = () => {
    refresh();
  };

  const handleShowMinutes = (topic, e) => {
    e.stopPropagation();
    selectTopic(topic);
    setMinutesModalOpen(true);
  };

  const handleCloseMinutesModal = () => {
    setMinutesModalOpen(false);
  };

  return (
    <div className="w-full flex flex-col pt-0 h-full">
      <div className="sticky top-0 z-10 bg-[var(--bg-color)]/80 backdrop-blur-md h-14 flex items-center justify-between px-6 py-2 mb-1 border-b border-[var(--glass-border)]">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Agendapunten...</h4>
        <AddButton onClick={handleNewTopic} ariaLabel="Nieuw agendapunt" className="scale-90" />
      </div>
      <div className="w-full max-w-full">
        <SortableList items={topics} sensors={sensors} onDragEnd={handleDragEnd}>
          {topics.map((topic) => (
            <SortableItem key={topic.id} id={topic.id} dragHandlePosition="inside">
              {(dragHandleProps) => (
                <div
                  onClick={() => selectTopic(topic)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors relative ${
                    selectedTopic?.id === topic.id
                      ? topic.state === "discussed"
                        ? "mb-2 bg-green-100 border-green-300 text-green-900 border-2 dark:bg-green-900/40 dark:border-green-700 dark:text-green-100"
                        : "mb-2 bg-blue-50 border-blue-200 text-blue-900 border-2 dark:bg-blue-900/40 dark:border-blue-700 dark:text-blue-100"
                      : topic.state === "discussed"
                        ? "mb-2 bg-green-100 border-green-300 text-green-900 dark:bg-green-900/30 dark:border-green-800 dark:text-green-200"
                        : "mb-2 bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:text-gray-200"
                  }`}
                >
                  <div
                    {...dragHandleProps}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 cursor-move hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 select-none"
                    style={{ touchAction: "none" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    ⋮⋮
                  </div>
                  <div className="flex items-center justify-between pl-6">
                    <div className="flex items-center flex-1">
                      <div className="font-medium">{topic.name}</div>
                      <RemarksIndicator entityId={topic.id} entityType="meeting_topic" size="sm" className="ml-2" />
                    </div>
                    <div className="flex gap-1 items-center">
                      <div className="relative group">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTopic(topic);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
                        >
                          <InformationCircleIcon className="w-6 h-6" />
                        </button>
                        {(topic.description || topic.expand?.contributor) && (
                          <div className="absolute right-0 bottom-full mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 pointer-events-none z-20 transition-opacity duration-150 shadow-lg">
                            {topic.expand?.contributor && (
                              <div>
                                <span className="text-gray-400">Indiener: </span>
                                {topic.expand.contributor.name}
                              </div>
                            )}
                            {topic.description && (
                              <div className={topic.expand?.contributor ? "mt-1" : ""}>
                                <span className="text-gray-400">Toelichting: </span>
                                {topic.description}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={(e) => handleShowMinutes(topic, e)}
                        className="md:hidden p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:text-green-400 dark:hover:bg-green-900/30 rounded transition-colors"
                        title="Notities"
                      >
                        <DocumentTextIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </SortableItem>
          ))}
        </SortableList>
        <div className="h-200" />

        {topics.length === 0 && (
          <div className="text-gray-500 dark:text-gray-400 italic">Geen agendapunten gevonden</div>
        )}
      </div>

      <EditMeetingTopicDialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        topic={topicToView}
        meetingId={meetingId}
        onSave={handleTopicSaved}
      />

      {/* Minutes Modal - Only visible on mobile */}
      <DialogPanel
        open={minutesModalOpen}
        onClose={handleCloseMinutesModal}
        title={selectedTopic ? `Notities - ${selectedTopic.name}` : "Notities"}
      >
        {selectedTopic && minutesHook && (
          <MinutesList
            topicsHook={topicsHook}
            minutesHook={minutesHook}
            currentMinutes={currentMinutes}
            currentUserId={pb.authStore.record?.id}
            onEditMinute={onEditMinute}
          />
        )}
      </DialogPanel>
    </div>
  );
});

export default TopicsList;
