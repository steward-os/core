import React from "react";
import DetailBlock, { Label, Row, Value } from "../../components/Detail/DetailBlock";
import DetailCard from "../../components/Detail/DetailCard";
import EditNoteModal from "../meetingMinutes/EditNoteModal";
import MinutesList from "../meetingMinutes/MinutesList";
import PresentWidget from "../meetingMinutes/PresentWidget";
import TopicsList from "../meetingMinutes/TopicsList";
import { useMinutes } from "../../hooks/useMinutes";
import { useTopics } from "../../hooks/useTopics";
import pb from "../../pb";
import { formatDateTime } from "../../utils/dateTimeUtils";

/**
 * Shared meeting detail content used by both MeetingDetail (page) and MeetingDetailModal.
 *
 * @param {Object}   meeting         — the meeting record (with expand.meeting_template, expand.present)
 * @param {string}   id              — meeting record ID
 * @param {Function} onMeetingUpdate — called to refresh the meeting record (e.g. after attendance change)
 */
const MeetingDetailContent = ({ meeting, id, onMeetingUpdate }) => {
  const [editingMinute, setEditingMinute] = React.useState(null);
  const [editModalOpen, setEditModalOpen] = React.useState(false);

  const topicsHook = useTopics(id);
  const minutesHook = useMinutes(id);

  const currentMinutes = topicsHook.selectedTopic
    ? minutesHook.getMinutesForTopic(topicsHook.selectedTopic.id)
    : [];

  const handleEditMinute = (minute) => {
    setEditingMinute(minute);
    setEditModalOpen(true);
  };

  const handleSaveMinute = async () => {
    await minutesHook.refresh();
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingMinute(null);
  };

  return (
    <>
      <DetailCard title="Vergadergegevens" className="mb-4">
        <DetailBlock>
          {meeting.date_time && (
            <Row>
              <Label>Datum</Label>
              <Value>{formatDateTime(meeting.date_time)}</Value>
            </Row>
          )}
          {meeting.expand?.meeting_template && (
            <Row>
              <Label>Template</Label>
              <Value>{meeting.expand.meeting_template.name}</Value>
            </Row>
          )}
          <Row>
            <Label>Aanwezigheid</Label>
            <div className="pt-1">
              <PresentWidget meeting={meeting} onMeetingUpdate={onMeetingUpdate} />
            </div>
          </Row>
        </DetailBlock>
      </DetailCard>

      <DetailCard>
        <div className="w-full md:w-[30%] max-h-screen overflow-y-auto custom-scrollbar md:pr-10">
          <TopicsList
            topicsHook={topicsHook}
            meetingId={id}
            minutesHook={minutesHook}
            currentMinutes={currentMinutes}
            onEditMinute={handleEditMinute}
          />
        </div>
        <div className="hidden md:block w-full md:w-[70%] h-full overflow-y-auto custom-scrollbar md:pr-1">
          <MinutesList
            topicsHook={topicsHook}
            minutesHook={minutesHook}
            currentMinutes={currentMinutes}
            currentUserId={pb.authStore.record?.id}
            onEditMinute={handleEditMinute}
          />
        </div>
      </DetailCard>

      <EditNoteModal
        open={editModalOpen}
        onClose={handleCloseEditModal}
        minute={editingMinute}
        onSave={handleSaveMinute}
      />
    </>
  );
};

export default MeetingDetailContent;
