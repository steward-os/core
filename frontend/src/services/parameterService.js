import pb from "../pb";

/**
 * Get a single parameter by ID
 * @param {string} id - Parameter ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Parameter data
 */
export async function getParameter(id, options = {}) {
  return await pb.collection("mb_parameters").getOne(id, options);
}

/**
 * Get all parameters with filtering and sorting
 * @param {Object} options - Query options (filter, sort, etc.)
 * @returns {Promise<Array>} List of parameters
 */
export async function getParameters(options = {}) {
  const defaultOptions = {
    sort: "name",
    ...options
  };
  return await pb.collection("parameters").getFullList(defaultOptions);
}

/**
 * Get paginated parameters
 * @param {number} page - Page number
 * @param {number} perPage - Items per page
 * @param {Object} options - Query options (filter, sort, etc.)
 * @returns {Promise<Object>} Paginated parameter data
 */
export async function getParametersPage(page = 1, perPage = 50, options = {}) {
  const defaultOptions = {
    sort: "name",
    ...options
  };
  return await pb.collection("parameters").getList(page, perPage, defaultOptions);
}

/**
 * Create a new parameter
 * @param {Object} data - Parameter data to create
 * @returns {Promise<Object>} Created parameter
 */
export async function createParameter(data) {
  return await pb.collection("parameters").create(data);
}

/**
 * Update a parameter
 * @param {string} id - Parameter ID
 * @param {Object} data - Parameter data to update
 * @returns {Promise<Object>} Updated parameter
 */
export async function updateParameter(id, data) {
  return await pb.collection("parameters").update(id, data);
}

/**
 * Delete a parameter
 * @param {string} id - Parameter ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteParameter(id) {
  return await pb.collection("parameters").delete(id);
}
