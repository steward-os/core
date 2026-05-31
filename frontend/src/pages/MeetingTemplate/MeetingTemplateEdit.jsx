import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CloseButton } from "../../components/Button/CloseButton";
import PageHeader from "../../components/Page/PageHeader";
import PageContent from "../../components/Page/PageContent";
import { Button } from "../../components/Button/Button";
import Input from "../../components/Form/Input";
import Textarea from "../../components/Form/Textarea";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import DetailCard from "../../components/Detail/DetailCard";
import DetailBlock, { Row, Label } from "../../components/Detail/DetailBlock";
import { SortableItem, SortableList, useDragAndDrop } from "../../components/DragAndDrop";
import { meetingTemplateSchema } from "../../schemas/meetingTemplateSchema";
import pb from "../../pb";
import { useCreateMeetingTemplate, useUpdateMeetingTemplate } from "../../hooks/crudResourceHooks";

const MeetingTemplateEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCreateMode = !id;
  const createMeetingTemplateMutation = useCreateMeetingTemplate();
  const updateMeetingTemplateMutation = useUpdateMeetingTemplate();
  const [meetingTemplate, setMeetingTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [topics, setTopics] = useState([]);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [creatingTopic, setCreatingTopic] = useState(false);

  const form = useForm({
    resolver: zodResolver(meetingTemplateSchema),
    defaultValues: { name: "", description: "", topics: [] },
  });

  const { sensors, handleDragEnd } = useDragAndDrop({
    items: topics,
    setItems: setTopics,
    updateOrder: async (newTopics) => {
      const updatePromises = newTopics.map((topic, index) =>
        pb.collection("bs_meeting_template_topics").update(topic.id, { order: index })
      );
      await Promise.all(updatePromises);
    },
  });

  const fetchTopics = async (templateId) => {
    if (!templateId) return;
    setLoadingTopics(true);
    try {
      const records = await pb.collection("bs_meeting_template_topics").getList(1, 100, {
        filter: `meeting_template = "${templateId}"`,
        sort: "order,name",
      });
      setTopics(records.items);
    } catch (error) {
      console.error("Error fetching meeting template topics:", error);
    } finally {
      setLoadingTopics(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (!isCreateMode) {
          const templateData = await pb.collection("bs_meeting_templates").getOne(id);
          setMeetingTemplate(templateData);
          form.reset({ name: templateData.name || "", description: templateData.description || "", topics: templateData.topics || [] });
          await fetchTopics(id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };
    loadData();
  }, [id, isCreateMode, form]);

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    if (!newTopicName.trim() || isCreateMode) return;
    try {
      setCreatingTopic(true);
      const maxOrder = Math.max(...topics.map((t) => t.order || 0), 0);
      const newTopic = await pb.collection("bs_meeting_template_topics").create({
        name: newTopicName.trim(),
        order: maxOrder + 1,
        meeting_template: id,
      });
      setTopics([...topics, newTopic]);
      setNewTopicName("");
    } catch (error) {
      console.error("Error creating topic:", error);
      alert("Fout bij toevoegen van topic.");
    } finally {
      setCreatingTopic(false);
    }
  };

  const handleDeleteTopic = async (topic) => {
    if (!window.confirm(`Weet je zeker dat je het topic "${topic.name}" wilt verwijderen?`)) return;
    try {
      await pb.collection("bs_meeting_template_topics").delete(topic.id);
      setTopics((prev) => prev.filter((t) => t.id !== topic.id));
      const currentTopics = form.getValues("topics") || [];
      form.setValue("topics", currentTopics.filter((topicId) => topicId !== topic.id));
    } catch (error) {
      console.error("Error deleting topic:", error);
      alert("Verwijderen mislukt.");
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const templateData = { name: data.name, description: data.description || "", topics: data.topics || [] };
      if (isCreateMode) {
        const result = await createMeetingTemplateMutation.mutateAsync(templateData);
        navigate(`/meeting-templates/${result.id}?${searchParams.toString()}`);
      } else {
        await updateMeetingTemplateMutation.mutateAsync({ id, data: templateData });
        navigate(`/meeting-templates/${id}?${searchParams.toString()}`);
      }
    } catch (error) {
      console.error("Error saving meeting template:", error);
      alert("Er is een fout opgetreden bij het opslaan van de template.");
    }
    setSaving(false);
  };

  const TopicItem = ({ topic }) => {
    const isSelected = (form.watch("topics") || []).includes(topic.id);
    return (
      <SortableItem
        id={topic.id}
        className="flex items-center p-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded hover:bg-black/5 dark:hover:bg-white/10"
      >
        <div className="flex items-center w-full">
          <input
            type="checkbox"
            id={`topic-${topic.id}`}
            checked={isSelected}
            onChange={(e) => {
              const currentTopics = form.getValues("topics") || [];
              const newTopics = e.target.checked
                ? [...currentTopics, topic.id]
                : currentTopics.filter((topicId) => topicId !== topic.id);
              form.setValue("topics", newTopics);
            }}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor={`topic-${topic.id}`} className="flex-1 cursor-pointer text-[var(--text-primary)]">
            {topic.name}
          </label>
          <button
            type="button"
            onClick={() => handleDeleteTopic(topic)}
            className="ml-2 p-1 text-[var(--text-secondary)] hover:text-red-600 hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors"
            title="Verwijder topic"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </SortableItem>
    );
  };

  if (loading) return <CenteredSpinner />;
  if (!isCreateMode && !meetingTemplate && !loading) return <CenteredAlert text="Meeting template niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader title={isCreateMode ? "Nieuwe meeting template" : "Meeting template bewerken"} variant="edit">
        <CloseButton
          onClick={() => navigate(isCreateMode ? `/meeting-templates?${searchParams.toString()}` : `/meeting-templates/${id}?${searchParams.toString()}`)}
          size="normal"
          ariaLabel="Annuleren"
        />
      </PageHeader>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DetailCard title="Template gegevens">
          <DetailBlock>
            <Row>
              <Label htmlFor="name">Naam</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Naam van de template"
                error={form.formState.errors.name?.message}
                className="max-w-2xl"
              />
            </Row>
            <Row>
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Beschrijving van de template"
                rows={3}
                error={form.formState.errors.description?.message}
                className="max-w-2xl"
              />
            </Row>
          </DetailBlock>
        </DetailCard>

        {!isCreateMode && (
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="glass-header px-4 py-3">
              <h3 className="font-semibold text-[var(--text-primary)]">Topics</h3>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                  placeholder="Nieuwe topic naam"
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleCreateTopic(e); }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleCreateTopic}
                  disabled={creatingTopic || !newTopicName.trim()}
                  color="green"
                  text={creatingTopic ? "..." : "Toevoegen"}
                />
              </div>

              {loadingTopics ? (
                <div className="text-[var(--text-secondary)] p-4">Topics laden...</div>
              ) : topics.length === 0 ? (
                <div className="text-[var(--text-secondary)] p-4 border border-[var(--glass-border)] rounded-lg">
                  Geen topics gevonden. Voeg er een toe om te beginnen.
                </div>
              ) : (
                <SortableList
                  items={topics}
                  sensors={sensors}
                  onDragEnd={handleDragEnd}
                  className="space-y-2 max-h-60 overflow-y-auto border border-[var(--glass-border)] rounded-lg p-3"
                >
                  {topics.map((topic) => (
                    <TopicItem key={topic.id} topic={topic} />
                  ))}
                </SortableList>
              )}
              <p className="text-sm text-[var(--text-secondary)]">
                Sleep topics om ze te herordenen. Vink topics aan om ze te selecteren voor deze template.
              </p>
            </div>
          </div>
        )}

        {isCreateMode && (
          <p className="text-sm text-[var(--text-secondary)]">Sla eerst de template op om topics toe te voegen.</p>
        )}

        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={() => navigate(isCreateMode ? `/meeting-templates?${searchParams.toString()}` : `/meeting-templates/${id}?${searchParams.toString()}`)}
            color="gray"
            text="Annuleren"
            className="w-full md:w-auto md:min-w-[160px] justify-center"
          />
          <Button
            type="submit"
            disabled={saving || form.formState.isSubmitting}
            color="blue"
            text={saving ? "Opslaan..." : "Opslaan"}
            className="w-full md:w-auto md:min-w-[160px] justify-center"
          />
        </div>
      </form>
    </PageContent>
  );
};

export default MeetingTemplateEdit;
