import pb from "../pb";

/**
 * Get a single section by ID
 * @param {string} id - Section ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Section data
 */
export async function getSection(id, options = {}) {
  return await pb.collection("mb_sections").getOne(id, options);
}

/**
 * Get sections with pagination, filtering and sorting
 * @param {number} page - Page number
 * @param {number} perPage - Items per page
 * @param {Object} options - Query options (filter, sort)
 * @returns {Promise<Object>} Paginated section list
 */
export async function getSections(page = 1, perPage = 50, options = {}) {
  return await pb.collection("mb_sections").getList(page, perPage, options);
}

/**
 * Get all sections with filtering and sorting
 * @param {Object} options - Query options (filter, sort)
 * @returns {Promise<Array>} Section list
 */
export async function getAllSections(options = {}) {
  return await pb.collection("mb_sections").getFullList(options);
}

/**
 * Create a new section
 * @param {Object} data - Section data to create
 * @returns {Promise<Object>} Created section
 */
export async function createSection(data) {
  return await pb.collection("mb_sections").create(data);
}

/**
 * Update an existing section
 * @param {string} id - Section ID
 * @param {Object} data - Updated section data
 * @returns {Promise<Object>} Updated section
 */
export async function updateSection(id, data) {
  return await pb.collection("mb_sections").update(id, data);
}

/**
 * Delete a section; memberships that had it keep their group but lose the section
 * @param {string} id - Section ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteSection(id) {
  return await pb.collection("mb_sections").delete(id);
}
