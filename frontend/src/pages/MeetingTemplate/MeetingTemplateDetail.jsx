import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../components/Button/BackButton";
import { Button } from "../../components/Button/Button";
import { EditButton } from "../../components/Button/EditButton";
import { DeleteButton } from "../../components/Button/DeleteButton";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import DetailCard from "../../components/Detail/DetailCard";
import DetailBlock, { Row, Label, Value } from "../../components/Detail/DetailBlock";
import pb from "../../pb";
import { useDeleteMeetingTemplate } from "../../hooks/crudResourceHooks";

const MeetingTemplateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deleteMeetingTemplateMutation = useDeleteMeetingTemplate();
  const [meetingTemplate, setMeetingTemplate] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetingTemplateAndTopics = async () => {
      setLoading(true);
      try {
        const templateData = await pb.collection("bs_meeting_templates").getOne(id);
        setMeetingTemplate(templateData);

        const topicsData = await pb.collection("bs_meeting_template_topics").getList(1, 100, {
          filter: `meeting_template = "${id}"`,
          sort: "order,name",
        });
        setTopics(topicsData.items);
      } catch (error) {
        console.error("Error fetching meeting template and topics:", error);
        setMeetingTemplate(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetingTemplateAndTopics();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je deze template wilt verwijderen?")) return;
    try {
      await deleteMeetingTemplateMutation.mutateAsync(id);
      navigate(`/meeting-templates?${searchParams.toString()}`);
    } catch (error) {
      console.error("Error deleting meeting template:", error);
      alert("Er is een fout opgetreden bij het verwijderen van de template.");
    }
  };

  if (loading) return <CenteredSpinner />;
  if (!meetingTemplate) return <CenteredAlert text="Meeting template niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title={meetingTemplate.name}
        backButton={
          <BackButton
            onClick={() => navigate(`/meeting-templates?${searchParams.toString()}`)}
            ariaLabel="Terug naar templates"
          />
        }
      >
        <EditButton
          onClick={() => navigate(`/meeting-templates/${id}/edit?${searchParams.toString()}`)}
          showText
          size="normal"
          ariaLabel="Template bewerken"
        />
        <DeleteButton onClick={handleDelete} showText size="normal" ariaLabel="Template verwijderen" />
      </PageHeader>

      <div className="space-y-6">
        <DetailCard title="Template gegevens">
          <DetailBlock>
            <Row>
              <Label>Naam</Label>
              <Value>{meetingTemplate.name}</Value>
            </Row>
            {meetingTemplate.description && (
              <Row>
                <Label>Beschrijving</Label>
                <Value>{meetingTemplate.description}</Value>
              </Row>
            )}
          </DetailBlock>
        </DetailCard>

        <DetailCard title={`Topics (${topics.length})`}>
          {topics.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-[var(--text-secondary)] mb-4">Geen topics gevonden voor deze template.</p>
              <Button
                onClick={() => navigate(`/meeting-templates/${id}/edit?${searchParams.toString()}`)}
                color="blue"
                text="Topics toevoegen"
              />
            </div>
          ) : (
            <div className="space-y-2">
              {topics.map((topic, index) => (
                <div
                  key={topic.id}
                  className="flex items-center p-3 bg-[var(--glass-bg)] rounded-lg border border-[var(--glass-border)]"
                >
                  <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-medium mr-3 shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-[var(--text-primary)]">{topic.name}</span>
                </div>
              ))}
            </div>
          )}
        </DetailCard>
      </div>
    </PageContent>
  );
};

export default MeetingTemplateDetail;
