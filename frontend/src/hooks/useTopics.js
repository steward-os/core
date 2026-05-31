import { useState } from 'react';
import { useRealtimeCollection } from './useRealtimeCollection';
import { useDragAndDrop } from './useDragAndDrop';
import pb from '../pb';

export const useTopics = (meetingId) => {
  const [selectedTopic, setSelectedTopic] = useState(null);
  
  const {
    data: topics,
    loading,
    error,
    setData: setTopics,
    refresh
  } = useRealtimeCollection('bs_meeting_topics', {
    filter: meetingId ? `meeting = "${meetingId}"` : '',
    sort: 'order',
    expand: 'contributor',
    dependencies: [meetingId]
  });

  const updateTopicState = async (topicId, newState) => {
    try {
      await pb.collection('bs_meeting_topics').update(topicId, { state: newState });
      
      // Update selectedTopic if it's the one being updated
      if (selectedTopic?.id === topicId) {
        setSelectedTopic({ ...selectedTopic, state: newState });
      }
      
      await refresh();
    } catch (error) {
      console.error("Error updating topic state:", error);
      throw error;
    }
  };

  const reorderTopics = async (newTopics) => {
    try {
      const updatePromises = newTopics.map((topic, index) => 
        pb.collection('bs_meeting_topics').update(topic.id, { order: index })
      );
      await Promise.all(updatePromises);
      await refresh();
    } catch (error) {
      console.error("Error reordering topics:", error);
      throw error;
    }
  };

  const { sensors, handleDragEnd } = useDragAndDrop({
    items: topics,
    setItems: setTopics,
    updateOrder: reorderTopics
  });

  const selectTopic = (topic) => {
    setSelectedTopic(topic);
  };

  return {
    topics,
    selectedTopic,
    loading,
    error,
    selectTopic,
    updateTopicState,
    reorderTopics,
    sensors,
    handleDragEnd,
    refresh
  };
};