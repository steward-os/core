import { DocumentArrowDownIcon, DocumentDuplicateIcon } from "@heroicons/react/24/outline";
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BackButton } from "../../components/Button/BackButton";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import MeetingDetailContent from "../../features/meetings/MeetingDetailContent";
import { getMeeting, getMeetingTopics } from "../../services/meetingService";
import { getMediaFiles, getMediaFileUrl } from "../../services/mediaFileService";
import { getMinutes } from "../../services/notesService";
import { formatDateTime } from "../../utils/dateTimeUtils";
import { generateMinutesPdf } from "../../utils/minutesPdfUtils";

const MeetingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = React.useState(null);
  const [meetingLoading, setMeetingLoading] = React.useState(true);
  const [logoUrl, setLogoUrl] = React.useState("");

  const fetchMeeting = React.useCallback(async () => {
    if (!id) {
      setMeetingLoading(false);
      return;
    }
    try {
      setMeetingLoading(true);
      const meetingData = await getMeeting(id, { expand: "meeting_template,present" });
      setMeeting(meetingData);
    } catch (error) {
      console.error("Error fetching meeting:", error);
    } finally {
      setMeetingLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchMeeting();
  }, [fetchMeeting]);

  React.useEffect(() => {
    getMediaFiles({ filter: 'name = "logo"' })
      .then((files) => {
        if (files.length > 0) setLogoUrl(getMediaFileUrl(files[0]));
      })
      .catch(() => {});
  }, []);

  if (meetingLoading) return <CenteredSpinner />;
  if (!meeting) return <CenteredAlert message="Vergadering niet gevonden" />;

  const fetchTopicsAndMinutes = async () => {
    const [topics, minutes] = await Promise.all([
      getMeetingTopics(id),
      getMinutes({
        filter: `meeting_topic.meeting = "${id}"`,
        sort: "order,created",
        expand: "meeting_topic,assigned_to",
        requestKey: `export-minutes-${id}`,
      }),
    ]);
    return { topics, minutes };
  };

  const buildCopyText = (topics, allMinutes) => {
    let text = logoUrl ? `![Logo](${logoUrl})\n\n` : "";
    text += `## Notulen - ${meeting.name}\n\n`;
    if (meeting.date_time) text += `**Datum:** ${formatDateTime(meeting.date_time)}\n\n`;
    if (meeting.expand?.present?.length > 0) {
      text += `**Aanwezig:** ${meeting.expand.present.map((u) => u.name).join(", ")}\n\n`;
    }
    text += "---\n\n";
    topics.forEach((topic, tIdx) => {
      text += `### ${tIdx + 1}. ${topic.name}\n\n`;
      const topicMinutes = allMinutes.filter((m) => m.meeting_topic === topic.id);
      if (topicMinutes.length > 0) {
        topicMinutes.forEach((minute, mIdx) => {
          text += `${tIdx + 1}.${mIdx + 1} `;
          if (minute.type === "note") text += `${minute.name}`;
          else if (minute.type === "action") text += `**Actie ${minute.expand?.assigned_to?.name}:** ${minute.name}`;
          else if (minute.type === "decision") text += `**Besluit:** ${minute.name}`;
          text += "\n\n";
        });
      } else {
        text += "*Geen notulen*\n\n";
      }
    });
    return text;
  };

  const handleCopyMarkdown = async () => {
    const { topics, minutes } = await fetchTopicsAndMinutes();
    navigator.clipboard.writeText(buildCopyText(topics, minutes));
    alert("Notulen gekopieerd naar clipboard");
  };

  const handleDownloadPdf = async () => {
    const { topics, minutes } = await fetchTopicsAndMinutes();
    generateMinutesPdf(meeting, topics, minutes, logoUrl);
  };

  return (
    <PageContent fullWidth>
      <PageHeader
        title={meeting.name}
        backButton={<BackButton onClick={() => navigate(`/meetings`)} ariaLabel="Terug naar berichten" />}
      >
        <button
          onClick={handleCopyMarkdown}
          className="flex items-center whitespace-nowrap w-full px-3 py-2 text-sm font-medium rounded-md text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors md:border md:border-[var(--glass-border)] md:shadow-sm"
        >
          <DocumentDuplicateIcon className="w-4 h-4 mr-1" />
          Kopieer als Markdown
        </button>
        <button
          onClick={handleDownloadPdf}
          className="flex items-center whitespace-nowrap w-full px-3 py-2 text-sm font-medium rounded-md text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors md:border md:border-[var(--glass-border)] md:shadow-sm"
          title="Download notulen als PDF"
        >
          <DocumentArrowDownIcon className="w-5 h-5 mr-1" />
          Download as PDF
        </button>
      </PageHeader>

      <MeetingDetailContent meeting={meeting} id={id} onMeetingUpdate={fetchMeeting} />
    </PageContent>
  );
};

export default MeetingDetail;
