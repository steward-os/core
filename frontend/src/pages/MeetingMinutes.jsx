import { useParams } from "react-router-dom";
import CenteredAlert from "../components/CenteredAlert";
import CenteredSpinner from "../components/CenteredSpinner";
import { useMeetingData } from "../hooks/useMeetingData";

const MeetingMinutes = () => {
  const { id } = useParams();

  const {
    meeting,
    topics,
    setTopics,
    allMinutes,
    setAllMinutes,
    loading,
    getMinutesForTopic,
    createMinute,
    updateMinute,
    refreshMeeting,
  } = useMeetingData(id);

  if (loading) return <CenteredSpinner />;
  if (!meeting) return <CenteredAlert message="Vergadering niet gevonden" />;

  const commonProps = {
    meeting,
    topics,
    setTopics,
    allMinutes,
    setAllMinutes,
    getMinutesForTopic,
    onAddMinute: createMinute,
    onUpdateMinute: updateMinute,
    refreshMeeting,
    meetingId: id,
  };

  return <MeetingMinutesDesktop {...commonProps} />;
};

export default MeetingMinutes;
