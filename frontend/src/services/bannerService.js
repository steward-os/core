import pb from "../pb";

/**
 * Get a single banner by ID
 * @param {string} id - Banner ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Banner data
 */
export async function getBanner(id, options = {}) {
  return await pb.collection("mb_banner_messages").getOne(id, options);
}

/**
 * Get all banners with filtering and sorting
 * @param {Object} options - Query options (filter, sort, etc.)
 * @returns {Promise<Array>} List of banners
 */
export async function getBanners(options = {}) {
  const defaultOptions = {
    sort: "order",
    ...options
  };
  return await pb.collection("mb_banner_messages").getFullList(defaultOptions);
}

/**
 * Get paginated banners
 * @param {number} page - Page number
 * @param {number} perPage - Items per page
 * @param {Object} options - Query options (filter, sort, etc.)
 * @returns {Promise<Object>} Paginated banner data
 */
export async function getBannersPage(page = 1, perPage = 50, options = {}) {
  const defaultOptions = {
    sort: "order",
    ...options
  };
  return await pb.collection("mb_banner_messages").getList(page, perPage, defaultOptions);
}

/**
 * Create a new banner
 * @param {Object} bannerData - Banner data to create
 * @returns {Promise<Object>} Created banner
 */
export async function createBanner(bannerData) {
  return await pb.collection("mb_banner_messages").create(bannerData);
}

/**
 * Update a banner
 * @param {string} id - Banner ID
 * @param {Object} bannerData - Banner data to update
 * @returns {Promise<Object>} Updated banner
 */
export async function updateBanner(id, bannerData) {
  return await pb.collection("mb_banner_messages").update(id, bannerData);
}

/**
 * Delete a banner
 * @param {string} id - Banner ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteBanner(id) {
  return await pb.collection("mb_banner_messages").delete(id);
}

/**
 * Update banner order
 * @param {Array} banners - Array of banners with updated order
 * @returns {Promise<void>}
 */
export async function updateBannerOrder(banners) {
  const promises = banners.map((banner, index) =>
    pb.collection("mb_banner_messages").update(banner.id, { order: index })
  );
  await Promise.all(promises);
}