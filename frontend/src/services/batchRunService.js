import pb from "../pb";

export async function getBatchRun(id, options = {}) {
  return await pb.collection("fi_batch_runs").getOne(id, options);
}

export async function getBatchRuns(page = 1, perPage = 50, options = {}) {
  return await pb.collection("fi_batch_runs").getList(page, perPage, options);
}

export async function createBatchRun(data) {
  return await pb.collection("fi_batch_runs").create(data);
}

export async function updateBatchRun(id, data) {
  return await pb.collection("fi_batch_runs").update(id, data);
}

export async function deleteBatchRun(id) {
  return await pb.collection("fi_batch_runs").delete(id);
}

export async function getAllBatchRuns(options = {}) {
  return await pb.collection("fi_batch_runs").getFullList(options);
}
