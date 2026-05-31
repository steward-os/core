import pb from "../pb";

/**
 * Get a single message by ID
 * @param {string} id - Message ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Message data
 */
export async function getMessage(id, options = {}) {
  return await pb.collection("mb_messages").getOne(id, options);
}

/**
 * Get all messages with filtering and sorting
 * @param {Object} options - Query options (filter, sort, etc.)
 * @returns {Promise<Array>} List of messages
 */
export async function getMessages(options = {}) {
  const defaultOptions = {
    sort: "-created",
    ...options
  };
  return await pb.collection("mb_messages").getFullList(defaultOptions);
}

/**
 * Get paginated messages
 * @param {number} page - Page number
 * @param {number} perPage - Items per page
 * @param {Object} options - Query options (filter, sort, etc.)
 * @returns {Promise<Object>} Paginated message data
 */
export async function getMessagesPage(page = 1, perPage = 50, options = {}) {
  const defaultOptions = {
    sort: "-created",
    ...options
  };
  return await pb.collection("mb_messages").getList(page, perPage, defaultOptions);
}

/**
 * Create a new message (triggers push notification to all users)
 * @param {Object} messageData - Message data to create
 * @returns {Promise<Object>} Created message
 */
export async function createMessage(messageData) {
  return await pb.collection("mb_messages").create(messageData);
}

/**
 * Update a message
 * @param {string} id - Message ID
 * @param {Object} messageData - Message data to update
 * @returns {Promise<Object>} Updated message
 */
export async function updateMessage(id, messageData) {
  return await pb.collection("mb_messages").update(id, messageData);
}

/**
 * Delete a message
 * @param {string} id - Message ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteMessage(id) {
  return await pb.collection("mb_messages").delete(id);
}
