import pb from "../pb";

export async function getMediaFile(id) {
  return await pb.collection("mb_files").getOne(id);
}

export async function getMediaFiles(options = {}) {
  return await pb.collection("mb_files").getFullList({ sort: "name", ...options });
}

export async function getMediaFilesPage(page = 1, perPage = 50, options = {}) {
  return await pb.collection("mb_files").getList(page, perPage, { sort: "name", ...options });
}

export async function createMediaFile(data) {
  return await pb.collection("mb_files").create(data);
}

export async function updateMediaFile(id, data) {
  return await pb.collection("mb_files").update(id, data);
}

export async function deleteMediaFile(id) {
  return await pb.collection("mb_files").delete(id);
}

export function getMediaFileUrl(record) {
  return record?.file ? pb.files.getURL(record, record.file) : null;
}
