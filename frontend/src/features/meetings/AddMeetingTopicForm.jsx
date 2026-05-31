import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import pb from '../../pb';

const AddMeetingTopicForm = ({ meetingId, onTopicAdded }) => {
  const [topicName, setTopicName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topicName.trim()) return;

    setLoading(true);
    try {
      // Get the current highest order number for this meeting
      const existingTopics = await pb.collection('bs_meeting_topics').getFullList({
        filter: `meeting="${meetingId}"`,
        sort: "-order"
      });
      
      const nextOrder = existingTopics.length > 0 ? (existingTopics[0].order || 0) + 1 : 0;
      
      await pb.collection('bs_meeting_topics').create({
        name: topicName.trim(),
        state: 'open',
        meeting: meetingId,
        order: nextOrder,
        contributor: pb.authStore?.record?.id
      });
      
      setTopicName('');
      onTopicAdded();
    } catch (error) {
      console.error('Error creating meeting topic:', error);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
      <input
        type="text"
        value={topicName}
        onChange={(e) => setTopicName(e.target.value)}
        placeholder="Nieuw agendapunt..."
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !topicName.trim()}
        className="px-3 py-2 sm:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <PlusIcon className="w-4 h-4" />
        <span className="hidden sm:inline">
          {loading ? 'Toevoegen...' : 'Toevoegen'}
        </span>
      </button>
    </form>
  );
};

export default AddMeetingTopicForm;