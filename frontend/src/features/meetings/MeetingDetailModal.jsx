import React from "react";
import CenteredSpinner from "../../components/CenteredSpinner";
import DialogPanel from "../../components/Modal/DialogPanel";
import MeetingDetailContent from "./MeetingDetailContent";
import { getMeeting } from "../../services/meetingService";

/**
 * @param {boolean}   open
 * @param {Function}  onClose
 * @param {string}    id
 */
const MeetingDetailModal = ({ open, onClose, id }) => {
  const [meeting, setMeeting] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!id || !open) return;
    setLoading(true);
    getMeeting(id, { expand: "meeting_template,present" })
      .then(setMeeting)
      .catch((e) => console.error("Error fetching meeting:", e))
      .finally(() => setLoading(false));
  }, [id, open]);

  const handleMeetingUpdate = () => {
    if (!id) return;
    getMeeting(id, { expand: "meeting_template,present" })
      .then(setMeeting)
      .catch(() => {});
  };

  return (
    <DialogPanel open={open} onClose={onClose} title={meeting?.name || "Vergadering"} fullscreenOnMobile>
      {loading && <CenteredSpinner />}

      {meeting && (
        <MeetingDetailContent meeting={meeting} id={id} onMeetingUpdate={handleMeetingUpdate} />
      )}
    </DialogPanel>
  );
};

export default MeetingDetailModal;
