import pb from "../pb";
import { getRelationTags, createRelationTag } from "./tagService";
import { decryptList, decryptRecord, encryptIfNeeded } from "../utils/cryptoUtils";

const ENCRYPTION_KEY_NAME = "financieel";
const FIELDS_TO_ENCRYPT = ["iban"];

/**
 * Get a single relation by ID
 * @param {string} id - Relation ID
 * @param {Object} options - Query options (expand, etc.)
 * @returns {Promise<Object>} Relation data
 */
export async function getRelation(id, options = {}) {
  return decryptRecord(await pb.collection("bs_relations").getOne(id, options));
}

/**
 * Get relations with pagination, filtering and sorting
 * @param {number} page - Page number
 * @param {number} perPage - Items per page
 * @param {Object} options - Query options (expand, filter, sort)
 * @returns {Promise<Object>} Paginated relation list
 */
export async function getRelations(page = 1, perPage = 50, options = {}) {
  return decryptList(await pb.collection("bs_relations").getList(page, perPage, options));
}

export async function getAllRelations(options = {}) {
  return decryptList(
    await pb.collection("bs_relations").getFullList({
      sort: "last_name,first_name",
      ...options,
    }),
  );
}

/**
 * Create a new relation
 * @param {Object} relationData - Relation data to create
 * @returns {Promise<Object>} Created relation
 */
export async function createRelation(relationData) {
  return await pb
    .collection("bs_relations")
    .create(await encryptIfNeeded(relationData, FIELDS_TO_ENCRYPT, ENCRYPTION_KEY_NAME));
}

/**
 * Update an existing relation
 * @param {string} id - Relation ID
 * @param {Object} relationData - Updated relation data
 * @returns {Promise<Object>} Updated relation
 */
export async function updateRelation(id, relationData) {
  return await pb
    .collection("bs_relations")
    .update(id, await encryptIfNeeded(relationData, FIELDS_TO_ENCRYPT, ENCRYPTION_KEY_NAME, id));
}

/**
 * Delete a relation
 * @param {string} id - Relation ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteRelation(id) {
  return await pb.collection("bs_relations").delete(id);
}

/**
 * Extract all unique tag names from import data
 * @param {Array} relationsData - Array of relation data objects
 * @returns {Set} Set of unique tag names
 */
function extractUniqueTagNames(relationsData) {
  const uniqueTagNames = new Set();

  relationsData.forEach((relationData) => {
    if (relationData.tags && typeof relationData.tags === "string") {
      const tagNames = relationData.tags
        .split(",")
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      tagNames.forEach((tagName) => {
        uniqueTagNames.add(tagName);
      });
    }
  });

  return uniqueTagNames;
}

/**
 * Create all missing tags upfront
 * @param {Set} uniqueTagNames - Set of unique tag names from import
 * @param {Array} existingTags - Array of existing tags
 * @returns {Promise<Map>} Map of tag name (lowercase) -> tag ID
 */
async function createMissingTags(uniqueTagNames, existingTags) {
  const tagMap = new Map();

  // Add existing tags to map
  existingTags.forEach((tag) => {
    tagMap.set(tag.name.toLowerCase(), tag.id);
  });

  // Create missing tags
  for (const tagName of uniqueTagNames) {
    const normalizedName = tagName.toLowerCase();
    if (!tagMap.has(normalizedName)) {
      try {
        const newTag = await createRelationTag({
          name: tagName,
          description: `Auto-created during import`,
        });
        tagMap.set(normalizedName, newTag.id);
        console.log(`Created tag: ${tagName}`);
      } catch (error) {
        console.error(`Failed to create tag "${tagName}":`, error);
      }
    }
  }

  return tagMap;
}

/**
 * Process tags for a relation using pre-created tag map
 * @param {string} tagString - Comma-separated tag names
 * @param {Map} tagMap - Map of tag name (lowercase) -> tag ID
 * @returns {Array} Array of tag IDs
 */
function processTagsForRelation(tagString, tagMap) {
  if (!tagString || typeof tagString !== "string") {
    return [];
  }

  const tagNames = tagString
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name.length > 0);

  const tagIds = [];
  tagNames.forEach((tagName) => {
    const normalizedName = tagName.toLowerCase();
    if (tagMap.has(normalizedName)) {
      tagIds.push(tagMap.get(normalizedName));
    }
  });

  return tagIds;
}

/**
 * Bulk create relations
 * @param {Array<Object>} relationsData - Array of relation data objects
 * @returns {Promise<Object>} Results with success/error counts and details
 */
export async function bulkCreateRelations(relationsData) {
  // Load existing tags once at the start
  let existingTags = [];
  try {
    existingTags = await getRelationTags();
  } catch (error) {
    console.error("Failed to load existing tags:", error);
  }

  // Pre-process tags: extract unique tag names and create missing tags
  const uniqueTagNames = extractUniqueTagNames(relationsData);
  console.log(`Found ${uniqueTagNames.size} unique tag names in import data`);

  const tagMap = await createMissingTags(uniqueTagNames, existingTags);
  console.log(`Tag map created with ${tagMap.size} tags`);

  const results = {
    total: relationsData.length,
    successful: 0,
    failed: 0,
    errors: [],
    created: [],
  };

  for (let i = 0; i < relationsData.length; i++) {
    const relationData = relationsData[i];
    try {
      // Clean and validate data
      const cleanData = {
        salutation: relationData.salutation?.trim() || null,
        initials: relationData.initials?.trim() || null,
        first_name: relationData.first_name?.trim() || null,
        last_name: relationData.last_name?.trim() || null,
        organisation: relationData.organisation?.trim() || null,
        email: relationData.email?.trim() || null,
        telephone: relationData.telephone?.trim() || null,
        address1: relationData.address1?.trim() || null,
        address2: relationData.address2?.trim() || null,
        city: relationData.city?.trim() || null,
        zip: relationData.zip?.trim() || null,
        country: relationData.country?.trim() || null,
      };

      // Skip if no name is provided
      if (!cleanData.first_name && !cleanData.last_name) {
        results.failed++;
        results.errors.push({
          row: i + 1,
          data: relationData,
          error: "Minimaal een voor- of achternaam is vereist",
        });
        continue;
      }

      const created = await pb.collection("bs_relations").create(cleanData);

      // Process tags if present
      if (relationData.tags) {
        try {
          const tagIds = processTagsForRelation(relationData.tags, tagMap);
          if (tagIds.length > 0) {
            await pb.collection("bs_relations").update(created.id, {
              tags: tagIds,
            });
          }
        } catch (tagError) {
          console.error(`Error processing tags for relation ${created.id}:`, tagError);
          // Don't fail the entire import for tag errors
        }
      }

      results.successful++;
      results.created.push(created);
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: i + 1,
        data: relationData,
        error: error.message || "Onbekende fout",
      });
    }
  }

  return results;
}
