import pb from "../pb";

export async function getMailings(options = {}) {
  return await pb.collection("bs_mailings").getList(1, 200, options);
}

export async function getMailing(id, options = {}) {
  return await pb.collection("bs_mailings").getOne(id, options);
}

export async function createMailing(data) {
  return await pb.collection("bs_mailings").create(data);
}

export async function updateMailing(id, data) {
  return await pb.collection("bs_mailings").update(id, data);
}

export async function deleteMailing(id) {
  return await pb.collection("bs_mailings").delete(id);
}
