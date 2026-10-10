import pb from "../pb";

/**
 * Ids of the messages the user has opened, on any device. Users only see their own reads.
 * @param {string} userId - User ID
 * @returns {Promise<Set<string>>} Message ids
 */
export async function getReadMessageIds(userId) {
  const reads = await pb.collection("mb_message_reads").getFullList({
    filter: pb.filter("user = {:userId}", { userId }),
    fields: "message",
  });
  return new Set(reads.map((read) => read.message));
}

/**
 * Remembers that the user opened a message. Opening it again is not an error.
 * @param {string} messageId - Message ID
 * @param {string} userId - User ID
 */
export async function markMessageRead(messageId, userId) {
  try {
    await pb.collection("mb_message_reads").create({ message: messageId, user: userId }, { requestKey: null });
  } catch (error) {
    // The unique index refuses a second read of the same message: it was read already.
    if (error?.status !== 400) throw error;
  }
}
