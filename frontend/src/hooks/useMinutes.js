import { useQueryClient } from "@tanstack/react-query";
import {
  createMinuteForTopic,
  deleteMinute as deleteMinuteService,
  updateMinute as updateMinuteService,
  updateMinutesOrder,
} from "../services/notesService";
import { decryptList } from "../utils/cryptoUtils";
import { useDragAndDrop } from "./useDragAndDrop";
import { useRealtimeCollection } from "./useRealtimeCollection";

export const useMinutes = (meetingId) => {
  const queryClient = useQueryClient();
  const {
    data: allMinutes,
    loading,
    error,
    setData: setAllMinutes,
    refresh,
  } = useRealtimeCollection("bs_notes", {
    filter: meetingId ? `meeting_topic.meeting = "${meetingId}"` : "",
    sort: "order,created",
    expand: "meeting_topic,assigned_to",
    dependencies: [meetingId],
    transform: decryptList,
  });

  const getMinutesForTopic = (topicId) => {
    return allMinutes.filter((minute) => minute.meeting_topic === topicId);
  };

  const createMinute = async (topicId, text) => {
    if (!text.trim() || !topicId) return;

    try {
      await createMinuteForTopic(topicId, text);
      await refresh();
    } catch (error) {
      console.error("Error creating minute:", error);
      throw error;
    }
  };

  const updateMinute = async (minuteId, updates) => {
    try {
      await updateMinuteService(minuteId, updates);
      await refresh();
      if (updates.type === "action") {
        queryClient.invalidateQueries({ queryKey: ["bsActions"] });
      }
    } catch (error) {
      console.error("Error updating minute:", error);
      throw error;
    }
  };

  const deleteMinute = async (minuteId) => {
    try {
      await deleteMinuteService(minuteId);
      await refresh();
    } catch (error) {
      console.error("Error deleting minute:", error);
      throw error;
    }
  };

  const reorderMinutes = async (topicId, newMinutes) => {
    try {
      await updateMinutesOrder(newMinutes);
      await refresh();
    } catch (error) {
      console.error("Error reordering minutes:", error);
      throw error;
    }
  };

  const useDragAndDropForMinutes = (topicId) => {
    const topicMinutes = getMinutesForTopic(topicId);

    const updateMinutesForTopic = (newMinutes) => {
      const otherMinutes = allMinutes.filter((minute) => minute.meeting_topic !== topicId);
      setAllMinutes([...otherMinutes, ...newMinutes]);
    };

    return useDragAndDrop({
      items: topicMinutes,
      setItems: updateMinutesForTopic,
      updateOrder: (newMinutes) => reorderMinutes(topicId, newMinutes),
    });
  };

  return {
    allMinutes,
    loading,
    error,
    getMinutesForTopic,
    createMinute,
    updateMinute,
    deleteMinute,
    reorderMinutes,
    useDragAndDropForMinutes,
    refresh,
  };
};
