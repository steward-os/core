import { PaperAirplaneIcon, SparklesIcon, TrashIcon } from "@heroicons/react/24/outline";
import React from "react";
import { SortableItem } from "../../components/DragAndDrop/SortableItem";
import { SortableList } from "../../components/DragAndDrop/SortableList";
import SearchableSelect from "../../components/Form/SearchableSelect";
import { useTypingStatus } from "../../hooks/useTypingStatus";
import { getUsers } from "../../services/userService";
import { improveMinuteText } from "../../utils/geminiUtils";
import { minuteTypes } from "./minuteConstants";

const MinutesList = React.memo(({ topicsHook, minutesHook, currentMinutes, currentUserId, onEditMinute }) => {
  const { selectedTopic, updateTopicState } = topicsHook;

  const {
    typingText,
    setTypingText,
    typingUsers,
    clearTypingStatus,
    clearAllTypingForTopic,
    showLiveText,
    setShowLiveText,
  } = useTypingStatus(currentUserId, selectedTopic?.id);

  const { useDragAndDropForMinutes, createMinute, deleteMinute, updateMinute } = minutesHook;
  const { sensors, handleDragEnd } = useDragAndDropForMinutes(selectedTopic?.id);

  const [users, setUsers] = React.useState([]);
  const [creating, setCreating] = React.useState(false);
  const [deleting, setDeleting] = React.useState(null);
  const [improving, setImproving] = React.useState(false);
  const handleImprove = async () => {
    if (!typingText.trim()) return;
    setImproving(true);
    try {
      const improved = await improveMinuteText(typingText);
      setTypingText(improved);
    } catch (err) {
      alert(`Verbeteren mislukt: ${err.message}`);
    } finally {
      setImproving(false);
    }
  };

  React.useEffect(() => {
    getUsers({ sort: "-is_board_member,name", requestKey: null }).then(setUsers).catch(console.error);
  }, []);

  const handleCreateMinute = async () => {
    if (!typingText.trim() || !selectedTopic?.id) return;

    setCreating(true);
    try {
      await createMinute(selectedTopic.id, typingText);
      setTypingText("");
      await clearTypingStatus();
    } catch (error) {
      console.error("Error creating minute:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteMinute = async (minuteId) => {
    setDeleting(minuteId);
    try {
      await deleteMinute(minuteId);
    } catch (error) {
      console.error("Error deleting minute:", error);
    } finally {
      setDeleting(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleCreateMinute();
    }
  };

  const handleInputChange = (e) => {
    setTypingText(e.target.value);
  };

  return (
    <div className="flex-1 h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-[var(--bg-color)]/80 backdrop-blur-md h-14 flex items-center px-6 py-2 mb-1 border-b border-[var(--glass-border)]">
        <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Acties, besluiten en notities</h4>
      </div>
      <div className="w-full flex flex-col">
        {selectedTopic?.id ? (
          <div className="space-y-4">
            {currentMinutes.length > 0 ? (
              <div className="w-full max-w-full">
                <SortableList items={currentMinutes} sensors={sensors} onDragEnd={handleDragEnd}>
                  {currentMinutes.map((minute) => (
                    <SortableItem key={minute.id} id={minute.id} dragHandlePosition="right">
                      <div className="bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-lg p-3 mb-2">
                        <div className="flex items-center justify-between">
                          <select
                            value={minute.type}
                            onChange={(e) => {
                              const newType = e.target.value;
                              updateMinute(minute.id, {
                                type: newType,
                                ...(newType !== "action" ? { assigned_to: null } : {}),
                              });
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="hidden md:block mr-2 text-xs border border-gray-200 dark:border-gray-700 rounded px-1 py-1 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                          >
                            {Object.entries(minuteTypes).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                          {minute.type === "action" && (
                            <div className="hidden md:block mr-3 w-36" onClick={(e) => e.stopPropagation()}>
                              <SearchableSelect
                                value={minute.assigned_to || ""}
                                options={users.map((u) => ({ value: u.id, label: u.name }))}
                                onChange={(val) => updateMinute(minute.id, { assigned_to: val || null })}
                                placeholder="— niemand —"
                                inputClassName="w-full px-1 py-1 text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                              />
                            </div>
                          )}
                          <div
                            className="text-gray-900 dark:text-gray-100 flex-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={() => onEditMinute(minute)}
                          >
                            <span className="md:hidden">{minuteTypes[minute.type]} </span>
                            {minute.name}
                          </div>
                          <button
                            onClick={() => handleDeleteMinute(minute.id)}
                            disabled={deleting === minute.id}
                            className="ml-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleting === minute.id ? (
                              <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                            ) : (
                              <TrashIcon className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </SortableList>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">Geen notities voor dit agendapunt</p>
            )}

            {typingUsers.length > 0 && (
              <div className="mb-4">
                <ul>
                  {typingUsers.map((user) => (
                    <li key={user.id} className="text-gray-700 dark:text-gray-300">
                      {user.expand?.user?.name || "Onbekend"}:
                      {user.show_live_text ? (
                        <span className="italic"> {user.typing}</span>
                      ) : (
                        <span className="italic text-gray-500"> is aan het typen...</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={typingText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder={creating ? "Toevoegen..." : "Voeg een notitie toe..."}
                  disabled={creating || improving}
                  className="flex-1 px-4 py-2 border border-[var(--glass-border)] rounded-2xl h-10 bg-black/5 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:bg-gray-100/50 dark:disabled:bg-gray-700/50 disabled:cursor-not-allowed transition-all"
                />
                <button
                  onClick={handleImprove}
                  disabled={improving || !typingText.trim()}
                  className="p-2 w-10 h-10 flex items-center justify-center text-purple-600 hover:text-purple-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Verbeter met AI"
                >
                  {improving ? (
                    <div className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                  ) : (
                    <SparklesIcon className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={handleCreateMinute}
                  disabled={creating || !typingText.trim()}
                  className="p-2 w-10 h-10 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
                  title="Versturen"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
              <label className="flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showLiveText}
                  onChange={(e) => setShowLiveText(e.target.checked)}
                  className="mr-2 accent-blue-600"
                />
                <span className="text-xs text-gray-600 dark:text-gray-400">Toon mijn tekst live aan anderen</span>
              </label>
              <label className="flex items-center mt-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectedTopic.state === "discussed"}
                  onChange={async (e) => {
                    if (!selectedTopic?.id) return;
                    const newState = e.target.checked ? "discussed" : "open";
                    try {
                      await updateTopicState(selectedTopic.id, newState);
                      // Clear all typing statuses for all users when marked as discussed
                      if (newState === "discussed") {
                        await clearAllTypingForTopic();
                      }
                    } catch (error) {
                      console.error("Error updating topic state:", error);
                    }
                  }}
                  className="mr-2 accent-green-600"
                />
                <span className="text-green-700 font-semibold">Markeer als besproken</span>
              </label>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic">Selecteer een agendapunt om notities te bekijken</p>
        )}
      </div>
    </div>
  );
});

export default MinutesList;
