import { useState, useEffect, useRef } from 'react';
import { useRealtimeCollection } from './useRealtimeCollection';
import pb from '../pb';

export const useTypingStatus = (currentUserId, contentType) => {
  const [typingText, setTypingText] = useState('');
  const [showLiveText, setShowLiveText] = useState(false);
  const typingRecordIdRef = useRef(null);

  // Get typing users (excluding current user) for this specific topic
  const { data: typingUsers } = useRealtimeCollection('user_currently_typing', {
    filter: currentUserId && contentType
      ? `user != "${currentUserId}" && content_type = "${contentType}"`
      : currentUserId
      ? `user != "${currentUserId}"`
      : '',
    expand: 'user',
    dependencies: [currentUserId, contentType]
  });

  // Update typing status when text changes
  useEffect(() => {
    const updateTyping = async () => {
      if (!currentUserId || !contentType) return;

      // If text is empty, delete the typing record
      if (typingText === "") {
        if (typingRecordIdRef.current) {
          try {
            await pb.collection('user_currently_typing').delete(typingRecordIdRef.current);
            typingRecordIdRef.current = null;
          } catch (error) {
            console.error("Error deleting typing record:", error);
          }
        }
        return;
      }

      try {
        // Find existing typing record for this user and content
        if (!typingRecordIdRef.current) {
          const records = await pb.collection('user_currently_typing').getFullList({
            filter: `user = "${currentUserId}" && content_type = "${contentType}"`,
          });

          if (records.length > 0) {
            typingRecordIdRef.current = records[0].id;
          } else {
            const created = await pb.collection('user_currently_typing').create({
              user: currentUserId,
              content_type: contentType,
              typing: typingText,
              show_live_text: showLiveText
            });
            typingRecordIdRef.current = created.id;
            return;
          }
        }

        // Update existing record
        await pb.collection('user_currently_typing').update(typingRecordIdRef.current, {
          typing: typingText,
          show_live_text: showLiveText
        });
      } catch (error) {
        console.error("Error updating typing status:", error);
      }
    };

    updateTyping();
  }, [typingText, showLiveText, currentUserId, contentType]);

  const clearTypingStatus = async () => {
    if (typingRecordIdRef.current) {
      try {
        await pb.collection('user_currently_typing').delete(typingRecordIdRef.current);
        typingRecordIdRef.current = null;
      } catch (error) {
        console.error("Error deleting typing record:", error);
      }
    }
  };

  const clearAllTypingForTopic = async () => {
    if (!contentType) return;

    try {
      // Get all typing records for this topic
      const records = await pb.collection('user_currently_typing').getFullList({
        filter: `content_type = "${contentType}"`,
      });

      console.log(`Clearing ${records.length} typing records for topic ${contentType}`, records);

      // Delete all records
      await Promise.all(
        records.map(record => pb.collection('user_currently_typing').delete(record.id))
      );

      // Clear local reference only if our own record was deleted
      if (typingRecordIdRef.current && records.some(r => r.id === typingRecordIdRef.current)) {
        typingRecordIdRef.current = null;
      }

      console.log(`Successfully cleared all typing records for topic ${contentType}`);
    } catch (error) {
      console.error("Error clearing all typing records for topic:", error);
    }
  };

  // Clean up typing record on unmount or when content type changes
  useEffect(() => {
    return () => {
      clearTypingStatus();
    };
  }, [contentType]);

  return {
    typingText,
    setTypingText,
    typingUsers,
    clearTypingStatus,
    clearAllTypingForTopic,
    showLiveText,
    setShowLiveText
  };
};