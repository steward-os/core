import { createBsAction } from "../services/bsActionService";

/**
 * Returns a function that creates a bs_actions record from a bs_notes note.
 * Call it whenever a note's type is set to "action".
 */
export function useNoteActionSync() {
  const syncToAction = async (note) => {
    await createBsAction({
      name: note.name || "",
      state: note.state || "open",
      description: note.description || "",
      assigned_to: note.assigned_to || null,
      source_type: note.meeting_topic ? "bs_meeting_topics" : "",
      source_id: note.meeting_topic || "",
      tags: [],
    });
  };

  return { syncToAction };
}
