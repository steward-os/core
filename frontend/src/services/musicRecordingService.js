import pb from "../pb";

export async function getMusicRecording(id, options = {}) {
  return await pb.collection("mb_music_recordings").getOne(id, options);
}

export async function getMusicRecordings(options = {}) {
  const defaultOptions = { sort: "-created", ...options };
  return await pb.collection("mb_music_recordings").getFullList(defaultOptions);
}

export async function createMusicRecording(data) {
  return await pb.collection("mb_music_recordings").create(data);
}

export async function updateMusicRecording(id, data) {
  return await pb.collection("mb_music_recordings").update(id, data);
}

export async function deleteMusicRecording(id) {
  return await pb.collection("mb_music_recordings").delete(id);
}
