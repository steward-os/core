import pb from "../pb";

export async function getSetting(id, options = {}) {
  return await pb.collection("settings").getOne(id, options);
}

export async function getSettings(page = 1, perPage = 50, options = {}) {
  return await pb.collection("settings").getList(page, perPage, options);
}

export async function getAllSettings(options = {}) {
  return await pb.collection("settings").getFullList(options);
}

export async function createSetting(data) {
  return await pb.collection("settings").create(data);
}

export async function updateSetting(id, data) {
  return await pb.collection("settings").update(id, data);
}

export async function deleteSetting(id) {
  return await pb.collection("settings").delete(id);
}

export function getSettingFileUrl(record, field) {
  return record?.[field] ? pb.files.getURL(record, record[field]) : null;
}
