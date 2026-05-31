import pb from "../pb";
import { decryptList } from "../utils/cryptoUtils";

/**
 * Get all projects with filtering and options
 * @param {Object} options - Query options (filter, sort, expand, etc.)
 * @returns {Promise<Object>} Projects with pagination
 */
export async function getProjects(options = {}) {
  if (options.page || options.perPage) {
    return await pb.collection("bs_projects").getList(options.page || 1, options.perPage || 50, options);
  }
  return await pb.collection("bs_projects").getFullList(options);
}

/**
 * Get a single project by ID
 * @param {string} id - Project ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Project data
 */
export async function getProject(id, options = {}) {
  return await pb.collection("bs_projects").getOne(id, options);
}

/**
 * Create a new project
 * @param {Object} projectData - Project data to create
 * @returns {Promise<Object>} Created project
 */
export async function createProject(projectData) {
  return await pb.collection("bs_projects").create(projectData);
}

/**
 * Update an existing project
 * @param {string} id - Project ID
 * @param {Object} projectData - Updated project data
 * @returns {Promise<Object>} Updated project
 */
export async function updateProject(id, projectData) {
  return await pb.collection("bs_projects").update(id, projectData);
}

/**
 * Delete a project
 * @param {string} id - Project ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteProject(id) {
  return await pb.collection("bs_projects").delete(id);
}

/**
 * Get notes related to a project
 * @param {string} projectId - Project ID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Project notes
 */
export async function getProjectNotes(projectId, options = {}) {
  const defaultOptions = {
    filter: `project = "${projectId}"`,
    sort: "-created",
    expand: "assigned_to",
    ...options,
  };
  return decryptList(await pb.collection("bs_notes").getFullList(defaultOptions));
}
