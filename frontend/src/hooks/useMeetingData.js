import { useState, useEffect } from 'react';
import { getMeeting } from '../services/meetingService';
import { useTopics } from './useTopics';
import { useMinutes } from './useMinutes';

export const useMeetingData = (meetingId) => {
  const [meeting, setMeeting] = useState(null);
  const [meetingLoading, setMeetingLoading] = useState(true);

  // Use existing hooks for topics and minutes
  const { topics, setTopics, loading: topicsLoading } = useTopics(meetingId);
  const { allMinutes, getMinutesForTopic, createMinute, updateMinute, loading: minutesLoading } = useMinutes(meetingId);

  const fetchMeeting = async () => {
    if (!meetingId) {
      setMeetingLoading(false);
      return;
    }
    
    try {
      setMeetingLoading(true);
      const meetingData = await getMeeting(meetingId, {
        expand: 'meeting_template,present'
      });
      setMeeting(meetingData);
    } catch (error) {
      console.error("Error fetching meeting:", error);
    } finally {
      setMeetingLoading(false);
    }
  };

  useEffect(() => {
    fetchMeeting();
  }, [meetingId]);

  const refreshMeeting = async () => {
    await fetchMeeting();
  };

  // Combined loading state
  const loading = meetingLoading || topicsLoading || minutesLoading;

  return {
    meeting,
    topics,
    setTopics,
    allMinutes,
    setAllMinutes: () => {}, // Keep for compatibility but it's handled by useMinutes
    loading,
    getMinutesForTopic,
    createMinute,
    updateMinute,
    refreshMeeting
  };
};