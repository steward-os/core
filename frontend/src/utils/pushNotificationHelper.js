import pb from "../pb";

/**
 * Send a push notification when rehearsal marks are added or modified
 * @param {string} sessionId - The session ID
 * @param {string} sessionName - The session name
 * @param {string} oldRehearsalMarks - Previous rehearsal marks value
 * @param {string} newRehearsalMarks - New rehearsal marks value
 * @param {string[]} groups - The group IDs from the session
 */
export async function notifyRehearsalMarksChanged(sessionId, sessionName, oldRehearsalMarks, newRehearsalMarks, groups) {
  // Only notify if rehearsal marks were actually added or modified
  const wasEmpty = !oldRehearsalMarks || oldRehearsalMarks.trim() === "";
  const isNotEmpty = newRehearsalMarks && newRehearsalMarks.trim() !== "";
  const hasChanged = oldRehearsalMarks !== newRehearsalMarks;

  if (!hasChanged || (wasEmpty && !isNotEmpty)) {
    return;
  }

  try {
    // Create push message for specific user with session URL
    const pushMessage = await pb.collection("mb_messages").create({
      title: "Er is een repetitie aantekening toegevoegd",
      body: `Voor sessie: ${sessionName}`,
      groups: groups,
      url: `/sessions/${sessionId}`,
    });

    console.log("Push notification queued:", pushMessage);
  } catch (error) {
    console.error("Error creating push notification:", error);
  }
}
