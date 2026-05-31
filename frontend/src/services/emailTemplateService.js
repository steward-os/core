import pb from "../pb";

export async function getEmailTemplates(options = {}) {
  return await pb.collection("bs_mailing_templates").getList(1, 200, options);
}

export async function getEmailTemplate(id, options = {}) {
  return await pb.collection("bs_mailing_templates").getOne(id, options);
}

export async function createEmailTemplate(data) {
  return await pb.collection("bs_mailing_templates").create(data);
}

export async function updateEmailTemplate(id, data) {
  return await pb.collection("bs_mailing_templates").update(id, data);
}

export async function deleteEmailTemplate(id) {
  return await pb.collection("bs_mailing_templates").delete(id);
}
