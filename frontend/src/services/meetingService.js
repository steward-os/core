import pb from "../pb";

/**
 * Get a single meeting by ID
 * @param {string} id - Meeting ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Meeting data
 */
export async function getMeeting(id, options = {}) {
  return await pb.collection("bs_meetings").getOne(id, options);
}

/**
 * Get meetings with pagination, filtering and sorting
 * @param {number} page - Page number
 * @param {number} perPage - Items per page
 * @param {Object} options - Query options (expand, filter, sort)
 * @returns {Promise<Object>} Paginated meeting list
 */
export async function getMeetings(page = 1, perPage = 50, options = {}) {
  return await pb.collection("bs_meetings").getList(page, perPage, options);
}

/**
 * Get all meetings with filtering and sorting
 * @param {Object} options - Query options (expand, filter, sort)
 * @returns {Promise<Array>} Meeting list
 */
export async function getAllMeetings(options = {}) {
  return await pb.collection("bs_meetings").getFullList(options);
}

/**
 * Create a new meeting
 * @param {Object} meetingData - Meeting data to create
 * @returns {Promise<Object>} Created meeting
 */
export async function createMeeting(meetingData) {
  return await pb.collection("bs_meetings").create(meetingData);
}

/**
 * Update an existing meeting
 * @param {string} id - Meeting ID
 * @param {Object} meetingData - Updated meeting data
 * @returns {Promise<Object>} Updated meeting
 */
export async function updateMeeting(id, meetingData) {
  return await pb.collection("bs_meetings").update(id, meetingData);
}

/**
 * Delete a meeting
 * @param {string} id - Meeting ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteMeeting(id) {
  return await pb.collection("bs_meetings").delete(id);
}

/**
 * Get meeting with topics data (combines meeting + topics)
 * @param {string} meetingId - Meeting ID
 * @returns {Promise<Object>} Object with meetingData and topicsData
 */
export async function getMeetingWithTopics(meetingId) {
  try {
    const [meetingData, topicsData] = await Promise.all([
      getMeeting(meetingId, { expand: "meeting_template,present" }),
      pb.collection("bs_meeting_topics").getFullList({
        filter: `meeting="${meetingId}"`,
        sort: "order,created",
        expand: "contributor",
      }),
    ]);

    return { meetingData, topicsData };
  } catch (error) {
    console.error("Error fetching meeting and topics:", error);
    return { meetingData: null, topicsData: [] };
  }
}

/**
 * Get meeting topics for a specific meeting
 * @param {string} meetingId - Meeting ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Meeting topics
 */
export async function getMeetingTopics(meetingId, options = {}) {
  const defaultOptions = {
    filter: `meeting="${meetingId}"`,
    sort: "order,created",
    ...options,
  };
  return await pb.collection("bs_meeting_topics").getFullList(defaultOptions);
}

/**
 * Update meeting topics state in bulk
 * @param {Object} params - Parameters object
 * @param {Array} params.topics - All topics
 * @param {Array} params.selectedIds - Selected topic IDs
 * @param {string} params.newState - New state to set
 * @param {string} params.meetingId - Meeting ID
 * @param {Object} params.additionalData - Additional data to update
 */
export async function updateMeetingTopics({ topics, selectedIds, newState, additionalData = {} }) {
  if (!selectedIds || selectedIds.length === 0) {
    console.warn("No topics selected for update");
    return;
  }

  try {
    const topicsToUpdate = topics.filter((topic) => selectedIds.includes(topic.id));

    const updatePromises = topicsToUpdate.map((topic) =>
      updateMeetingTopic(topic.id, {
        state: newState,
        ...additionalData,
      })
    );

    await Promise.all(updatePromises);
  } catch (error) {
    console.error("Error updating meeting topics:", error);
    throw error;
  }
}

/**
 * Update a single meeting topic
 * @param {string} id - Topic ID
 * @param {Object} data - Data to update
 * @returns {Promise<Object>} Updated topic
 */
export async function updateMeetingTopic(id, data) {
  return await pb.collection("bs_meeting_topics").update(id, data);
}

/**
 * Create a meeting topic
 * @param {Object} data - Topic data
 * @returns {Promise<Object>} Created topic
 */
export async function createMeetingTopic(data) {
  return await pb.collection("bs_meeting_topics").create(data);
}

/**
 * Get a single meeting topic by ID
 * @param {string} id - Topic ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Meeting topic data
 */
export async function getMeetingTopic(id, options = {}) {
  return await pb.collection("bs_meeting_topics").getOne(id, options);
}

/**
 * Delete a meeting topic
 * @param {string} id - Topic ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteMeetingTopic(id) {
  return await pb.collection("bs_meeting_topics").delete(id);
}
