import pb from "../pb";

/**
 * Get remarks for a specific meeting topic
 * @param {string} meetingTopicId - Meeting topic ID
 * @param {Object} options - Query options (expand, sort, etc.)
 * @returns {Promise<Array>} Remarks for the meeting topic
 */
export async function getRemarksForMeetingTopic(meetingTopicId, options = {}) {
  const defaultOptions = {
    filter: `meeting_topic = "${meetingTopicId}"`,
    sort: "-created",
    expand: "author",
    ...options,
  };
  return await pb.collection("bs_meeting_topic_remarks").getFullList(defaultOptions);
}

/**
 * Create a new remark for a meeting topic
 * @param {Object} remarkData - Remark data to create
 * @returns {Promise<Object>} Created remark
 */
export async function createMeetingTopicRemark(remarkData) {
  return await pb.collection("bs_meeting_topic_remarks").create(remarkData);
}

/**
 * Get a single remark by ID
 * @param {string} id - Remark ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Remark
 */
export async function getMeetingTopicRemark(id, options = {}) {
  return await pb.collection("bs_meeting_topic_remarks").getOne(id, options);
}

/**
 * Update an existing remark
 * @param {string} id - Remark ID
 * @param {Object} remarkData - Updated remark data
 * @returns {Promise<Object>} Updated remark
 */
export async function updateMeetingTopicRemark(id, remarkData) {
  return await pb.collection("bs_meeting_topic_remarks").update(id, remarkData);
}

/**
 * Delete a remark
 * @param {string} id - Remark ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteMeetingTopicRemark(id) {
  return await pb.collection("bs_meeting_topic_remarks").delete(id);
}