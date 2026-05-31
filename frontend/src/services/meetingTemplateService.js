import pb from "../pb";

/**
 * Get a single meeting template by ID
 * @param {string} id - Meeting template ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Meeting template data
 */
export async function getMeetingTemplate(id, options = {}) {
  return await pb.collection("bs_meeting_templates").getOne(id, options);
}

/**
 * Get meeting templates with pagination, filtering and sorting
 * @param {number} page - Page number
 * @param {number} perPage - Items per page
 * @param {Object} options - Query options (expand, filter, sort)
 * @returns {Promise<Object>} Paginated meeting template list
 */
export async function getMeetingTemplates(page = 1, perPage = 50, options = {}) {
  return await pb.collection("bs_meeting_templates").getList(page, perPage, options);
}

/**
 * Get all meeting templates with filtering and sorting
 * @param {Object} options - Query options (expand, filter, sort)
 * @returns {Promise<Array>} Meeting template list
 */
export async function getAllMeetingTemplates(options = {}) {
  return await pb.collection("bs_meeting_templates").getFullList(options);
}

/**
 * Create a new meeting template
 * @param {Object} templateData - Meeting template data to create
 * @returns {Promise<Object>} Created meeting template
 */
export async function createMeetingTemplate(templateData) {
  return await pb.collection("bs_meeting_templates").create(templateData);
}

/**
 * Update an existing meeting template
 * @param {string} id - Meeting template ID
 * @param {Object} templateData - Updated meeting template data
 * @returns {Promise<Object>} Updated meeting template
 */
export async function updateMeetingTemplate(id, templateData) {
  return await pb.collection("bs_meeting_templates").update(id, templateData);
}

/**
 * Delete a meeting template
 * @param {string} id - Meeting template ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteMeetingTemplate(id) {
  return await pb.collection("bs_meeting_templates").delete(id);
}