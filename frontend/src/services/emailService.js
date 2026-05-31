import pb from "../pb";
import { decryptList, decryptRecord } from "../utils/cryptoUtils";

export async function getEmail(id, options = {}) {
  return decryptRecord(await pb.collection("bs_correspondence").getOne(id, { expand: "topic,relation", ...options }));
}

export async function getEmails(page = 1, perPage = 50, options = {}) {
  return decryptList(await pb.collection("bs_correspondence").getList(page, perPage, options));
}

export async function createEmail(data) {
  return await pb.collection("bs_correspondence").create(data);
}

export async function updateEmail(id, data) {
  return await pb.collection("bs_correspondence").update(id, data);
}

export async function deleteEmail(id) {
  return await pb.collection("bs_correspondence").delete(id);
}
