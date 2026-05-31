import pb from "../pb";

export async function getMessageReactions(messageId, options = {}) {
  return await pb.collection("mb_message_reactions").getFullList({
    filter: `message="${messageId}"`,
    expand: "user,standard_reaction",
    ...options,
  });
}

export async function getUserMessageReactions(messageId, userId) {
  return await pb.collection("mb_message_reactions").getFullList({
    filter: `message="${messageId}" && user="${userId}"`,
  });
}

export async function createMessageReaction(data) {
  return await pb.collection("mb_message_reactions").create(data);
}

export async function deleteMessageReaction(id) {
  return await pb.collection("mb_message_reactions").delete(id);
}
