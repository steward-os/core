import pb from "../pb";

export async function getMailingTemplateBlocks(options = {}) {
  return await pb.collection("bs_mailing_template_blocks").getList(1, 200, options);
}

export async function getMailingTemplateBlock(id, options = {}) {
  return await pb.collection("bs_mailing_template_blocks").getOne(id, options);
}

export async function createMailingTemplateBlock(data) {
  return await pb.collection("bs_mailing_template_blocks").create(data);
}

export async function updateMailingTemplateBlock(id, data) {
  return await pb.collection("bs_mailing_template_blocks").update(id, data);
}

export async function deleteMailingTemplateBlock(id) {
  return await pb.collection("bs_mailing_template_blocks").delete(id);
}
