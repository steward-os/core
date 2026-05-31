import pb from "../pb";
import { decryptList, decryptRecord, encryptIfNeeded } from "../utils/cryptoUtils";

const ENCRYPTION_KEY_NAME = "bestuur";
const FIELDS_TO_ENCRYPT = [];

/**
 * Get meeting minutes with filtering and options
 * @param {Object} options - Query options (filter, sort, expand, etc.)
 * @returns {Promise<Array>} Meeting minutes
 */
export async function getMinutes(options = {}) {
  return decryptList(await pb.collection("bs_notes").getFullList(options));
}

/**
 * Get meeting minutes for a specific topic
 * @param {string} topicId - Meeting topic ID
 * @param {Object} options - Additional query options
 * @returns {Promise<Array>} Meeting minutes for the topic
 */
export async function getMinutesByTopic(topicId, options = {}) {
  const defaultOptions = {
    filter: `meeting_topic = "${topicId}"`,
    sort: "-order",
    ...options,
  };
  return await getMinutes(defaultOptions);
}

/**
 * Get action items (minutes with type = "action")
 * @param {Object} options - Additional query options
 * @returns {Promise<Array|Object>} Action item minutes (Array for getFullList, Object with pagination for getList)
 */
export async function getActionItems(options = {}) {
  // Build combined filter
  const baseFilter = 'type = "action"';
  const additionalFilter = options.filter;
  const combinedFilter = additionalFilter ? `(${baseFilter}) && (${additionalFilter})` : baseFilter;

  const defaultOptions = {
    filter: combinedFilter,
    sort: options.sort || "-created",
    expand: options.expand || "assigned_to,meeting_topic,meeting_topic.meeting",
    ...options,
  };

  // Override filter to ensure we use the combined one
  defaultOptions.filter = combinedFilter;

  // Use getList for pagination, getFullList for all records
  if (options.page || options.perPage) {
    return decryptList(
      await pb.collection("bs_notes").getList(options.page || 1, options.perPage || 50, defaultOptions),
    );
  }

  return await getMinutes(defaultOptions);
}

/**
 * Get meeting minutes for multiple topics
 * @param {Array} topicIds - Array of topic IDs
 * @param {Object} options - Additional query options
 * @returns {Promise<Array>} Meeting minutes
 */
export async function getMinutesByTopics(topicIds, options = {}) {
  if (!topicIds || topicIds.length === 0) {
    return [];
  }

  const topicFilter = topicIds.map((id) => `meeting_topic = "${id}"`).join(" || ");
  const defaultOptions = {
    filter: `(${topicFilter})`,
    sort: "order,created",
    expand: "meeting_topic,assigned_to",
    ...options,
  };
  return await getMinutes(defaultOptions);
}

/**
 * Create a new meeting minute
 * @param {Object} minuteData - Minute data to create
 * @returns {Promise<Object>} Created minute
 */
export async function createMinute(minuteData) {
  return await pb
    .collection("bs_notes")
    .create(await encryptIfNeeded(minuteData, FIELDS_TO_ENCRYPT, ENCRYPTION_KEY_NAME));
}

/**
 * Create a meeting minute for a topic with auto-ordering
 * @param {string} topicId - Meeting topic ID
 * @param {string} text - Minute text/name
 * @param {Object} additionalData - Additional minute data
 * @returns {Promise<Object>} Created minute
 */
export async function createMinuteForTopic(topicId, text, additionalData = {}) {
  // Get existing minutes to determine next order
  const existingMinutes = await getMinutesByTopic(topicId);
  const nextOrder = existingMinutes.length > 0 ? existingMinutes[0].order + 1 : 1;

  return await createMinute({
    name: text.trim(),
    meeting_topic: topicId,
    type: "note",
    order: nextOrder,
    ...additionalData,
  });
}

/**
 * Update an existing meeting minute
 * @param {string} id - Minute ID
 * @param {Object} minuteData - Updated minute data
 * @returns {Promise<Object>} Updated minute
 */
export async function updateMinute(id, minuteData) {
  return await pb
    .collection("bs_notes")
    .update(id, await encryptIfNeeded(minuteData, FIELDS_TO_ENCRYPT, ENCRYPTION_KEY_NAME, id));
}

/**
 * Delete a meeting minute
 * @param {string} id - Minute ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteMinute(id) {
  return await pb.collection("bs_notes").delete(id);
}

/**
 * Update the order of multiple minutes
 * @param {Array} minutes - Array of minutes with updated order
 * @returns {Promise<void>}
 */
export async function updateMinutesOrder(minutes) {
  const updatePromises = minutes.map((minute, index) => updateMinute(minute.id, { order: index }));
  await Promise.all(updatePromises);
}

/**
 * Get a single meeting minute by ID
 * @param {string} id - Minute ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Meeting minute
 */
export async function getMinute(id, options = {}) {
  return decryptRecord(await pb.collection("bs_notes").getOne(id, options));
}
