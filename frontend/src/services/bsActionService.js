import pb from "../pb";
import { decryptList, decryptRecord } from "../utils/cryptoUtils";

export async function getBsActions(options = {}) {
  const { page, perPage, ...rest } = options;
  const result = page || perPage
    ? await pb.collection("bs_actions").getList(page || 1, perPage || 50, rest)
    : await pb.collection("bs_actions").getFullList(rest);
  return decryptList(result);
}

export async function getBsAction(id, options = {}) {
  return decryptRecord(await pb.collection("bs_actions").getOne(id, options));
}

export async function createBsAction(data) {
  return await pb.collection("bs_actions").create(data);
}

export async function updateBsAction(id, data) {
  return await pb.collection("bs_actions").update(id, data);
}

export async function deleteBsAction(id) {
  return await pb.collection("bs_actions").delete(id);
}

export async function getActionsByProject(projectId) {
  const connections = await pb.collection("bs_action_connections").getFullList({
    filter: `connection_model = "bs_projects" && connection_id = "${projectId}"`,
    expand: "action,action.assigned_to",
  });
  return connections.map((c) => c.expand?.action).filter(Boolean);
}
