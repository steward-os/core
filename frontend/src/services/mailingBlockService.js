import pb from "../pb";

export async function getMailingBlocks(options = {}) {
  return await pb.collection("bs_mailing_blocks").getList(1, 200, options);
}

export async function getMailingBlock(id, options = {}) {
  return await pb.collection("bs_mailing_blocks").getOne(id, options);
}

export async function createMailingBlock(data) {
  return await pb.collection("bs_mailing_blocks").create(data);
}

export async function updateMailingBlock(id, data) {
  return await pb.collection("bs_mailing_blocks").update(id, data);
}

export async function deleteMailingBlock(id) {
  return await pb.collection("bs_mailing_blocks").delete(id);
}
