import pb from "../pb";

export async function getStandardReaction(id, options = {}) {
  return await pb.collection("mb_standard_message_reactions").getOne(id, options);
}

export async function getStandardReactions(options = {}) {
  return await pb.collection("mb_standard_message_reactions").getFullList(options);
}

export async function getStandardReactionsPaginated(page = 1, perPage = 50, options = {}) {
  return await pb.collection("mb_standard_message_reactions").getList(page, perPage, options);
}

export async function createStandardReaction(data) {
  return await pb.collection("mb_standard_message_reactions").create(data);
}

export async function updateStandardReaction(id, data) {
  return await pb.collection("mb_standard_message_reactions").update(id, data);
}

export async function deleteStandardReaction(id) {
  return await pb.collection("mb_standard_message_reactions").delete(id);
}
