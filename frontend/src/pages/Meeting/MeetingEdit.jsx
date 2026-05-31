import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CloseButton } from "../../components/Button/CloseButton";
import PageHeader from "../../components/Page/PageHeader";
import PageContent from "../../components/Page/PageContent";
import dayjs from "dayjs";
import { Button } from "../../components/Button/Button";
import Input from "../../components/Form/Input";
import Select from "../../components/Form/Select";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import DetailCard from "../../components/Detail/DetailCard";
import DetailBlock, { Row, Label } from "../../components/Detail/DetailBlock";
import { meetingSchema } from "../../schemas/meetingSchema";
import pb from "../../pb";
import { getMeeting } from "../../services/meetingService";
import { useCreateMeeting, useUpdateMeeting } from "../../hooks/crudResourceHooks";

const MeetingEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCreateMode = !id;
  const createMeetingMutation = useCreateMeeting();
  const updateMeetingMutation = useUpdateMeeting();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [meetingTemplateOptions, setMeetingTemplateOptions] = useState([]);

  const form = useForm({
    resolver: zodResolver(meetingSchema),
    defaultValues: { name: "", date_time: "", meeting_template: "" },
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const templates = await pb.collection("bs_meeting_templates").getFullList({ sort: "name" });
        setMeetingTemplateOptions(templates);

        if (!isCreateMode) {
          const meetingData = await getMeeting(id, { expand: "meeting_template" });
          setMeeting(meetingData);
          form.reset({
            name: meetingData.name || "",
            date_time: meetingData.date_time ? dayjs(meetingData.date_time).format("YYYY-MM-DDTHH:mm") : "",
            meeting_template: meetingData.meeting_template || "",
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
      setLoading(false);
    };
    loadData();
  }, [id, isCreateMode, form]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const meetingData = {
        name: data.name,
        date_time: dayjs(data.date_time).toISOString(),
        meeting_template: data.meeting_template || null,
      };
      if (isCreateMode) {
        const result = await createMeetingMutation.mutateAsync(meetingData);
        navigate(`/meetings/${result.id}?${searchParams.toString()}`);
      } else {
        await updateMeetingMutation.mutateAsync({ id, data: meetingData });
        navigate(`/meetings/${id}?${searchParams.toString()}`);
      }
    } catch (error) {
      console.error("Error saving meeting:", error);
      alert("Er is een fout opgetreden bij het opslaan van de vergadering.");
    }
    setSaving(false);
  };

  if (loading) return <CenteredSpinner />;
  if (!isCreateMode && !meeting && !loading) return <CenteredAlert text="Vergadering niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader title={isCreateMode ? "Nieuwe vergadering" : "Vergadering bewerken"} variant="edit">
        <CloseButton
          onClick={() => navigate(isCreateMode ? `/meetings?${searchParams.toString()}` : `/meetings/${id}?${searchParams.toString()}`)}
          size="normal"
          ariaLabel="Annuleren"
        />
      </PageHeader>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DetailCard title="Vergadering">
          <DetailBlock>
            <Row>
              <Label htmlFor="name">Naam</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Naam van de vergadering"
                error={form.formState.errors.name?.message}
                className="max-w-2xl"
              />
            </Row>
            <Row>
              <Label htmlFor="date_time">Datum en tijd</Label>
              <Input
                id="date_time"
                {...form.register("date_time")}
                type="datetime-local"
                error={form.formState.errors.date_time?.message}
                className="max-w-2xl"
              />
            </Row>
            <Row>
              <Label htmlFor="meeting_template">Template</Label>
              <Select
                id="meeting_template"
                {...form.register("meeting_template")}
                error={form.formState.errors.meeting_template?.message}
                className="max-w-2xl"
              >
                <option value="">Geen template (optioneel)</option>
                {meetingTemplateOptions.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </Select>
            </Row>
          </DetailBlock>
        </DetailCard>

        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={() => navigate(isCreateMode ? `/meetings?${searchParams.toString()}` : `/meetings/${id}?${searchParams.toString()}`)}
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

export default MeetingEdit;
