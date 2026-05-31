import { zodResolver } from "@hookform/resolvers/zod";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import posthog from "../../posthog";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import { CloseButton } from "../../components/Button/CloseButton";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import DetailBlock, { Label, Row } from "../../components/Detail/DetailBlock";
import DetailCard from "../../components/Detail/DetailCard";
import Input from "../../components/Form/Input";
import Textarea from "../../components/Form/Textarea";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import { useCreateVolunteering, useUpdateVolunteering } from "../../hooks/crudResourceHooks";
import { volunteeringSchema } from "../../schemas/volunteeringSchema";
import { getVolunteeringJob } from "../../services/volunteeringService";

dayjs.extend(utc);

function toDatetimeLocal(value) {
  if (!value) return "";
  return dayjs(value).local().format("YYYY-MM-DDTHH:mm");
}

const VolunteeringEdit = ({ isVolunteerAdmin }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCreateMode = !id;
  const createVolunteeringMutation = useCreateVolunteering();
  const updateVolunteeringMutation = useUpdateVolunteering();
  const [volunteering, setVolunteering] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const form = useForm({
    resolver: zodResolver(volunteeringSchema),
    defaultValues: {
      name: "",
      date_time: "",
      number_needed: 1,
      number_orange: 0,
      number_red: 0,
      description: "",
    },
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (!isCreateMode) {
          const volunteeringData = await getVolunteeringJob(id);
          setVolunteering(volunteeringData);

          // Populate form with volunteering data
          form.reset({
            name: volunteeringData.name || "",
            date_time: toDatetimeLocal(volunteeringData.date_time),
            number_needed: volunteeringData.number_needed || 1,
            number_orange: volunteeringData.number_orange ?? 0,
            number_red: volunteeringData.number_red ?? 0,
            description: volunteeringData.description || "",
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
      // Convert local datetime to UTC ISO string
      const utcString = dayjs(data.date_time).utc().format("YYYY-MM-DDTHH:mm:ss[Z]");

      const volunteeringData = {
        name: data.name,
        date_time: utcString,
        number_needed: Number(data.number_needed),
        number_orange: Number(data.number_orange ?? 0),
        number_red: Number(data.number_red ?? 0),
        description: data.description || "",
      };

      let result;
      if (isCreateMode) {
        result = await createVolunteeringMutation.mutateAsync(volunteeringData);
        posthog.capture("volunteering created", {
          volunteering_id: result.id,
          volunteering_name: volunteeringData.name,
          number_needed: volunteeringData.number_needed,
        });
        navigate(`/volunteering/${result.id}?${searchParams.toString()}`);
      } else {
        result = await updateVolunteeringMutation.mutateAsync({ id, data: volunteeringData });
        posthog.capture("volunteering updated", {
          volunteering_id: id,
          volunteering_name: volunteeringData.name,
          number_needed: volunteeringData.number_needed,
        });
        navigate(`/volunteering/${id}?${searchParams.toString()}`);
      }
    } catch (error) {
      console.error("Error saving volunteering:", error);
      posthog.captureException(error);
      alert("Er is een fout opgetreden bij het opslaan van de vrijwilligersoproep.");
    }
    setSaving(false);
  };

  // Redirect if not admin and trying to access edit/create
  if (!isVolunteerAdmin) {
    return <CenteredAlert text="Je hebt geen toegang tot deze pagina." />;
  }

  if (loading) {
    return <CenteredSpinner />;
  }

  if (!isCreateMode && !volunteering && !loading) {
    return <CenteredAlert text="Vrijwilligersoproep niet gevonden." />;
  }

  return (
    <PageContent fullWidth>
      <PageHeader title={isCreateMode ? "Nieuwe vrijwilligersoproep" : "Vrijwilligersoproep bewerken"} variant="edit">
        <CloseButton
          onClick={() =>
            navigate(
              isCreateMode
                ? `/volunteering?${searchParams.toString()}`
                : `/volunteering/${id}?${searchParams.toString()}`,
            )
          }
          size="normal"
          ariaLabel="Annuleren"
        />
      </PageHeader>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DetailCard title="Informatie">
          <DetailBlock>
            <Row>
              <Label htmlFor="name" required>
                Naam
              </Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Naam van de oproep"
                error={form.formState.errors.name?.message}
              />
            </Row>

            <Row>
              <Label htmlFor="date_time" required>
                Datum en tijd
              </Label>
              <Input
                id="date_time"
                {...form.register("date_time")}
                type="datetime-local"
                error={form.formState.errors.date_time?.message}
              />
            </Row>

            <Row>
              <Label htmlFor="number_needed" required>
                Aantal nodig
              </Label>
              <Input
                id="number_needed"
                {...form.register("number_needed", {
                  setValueAs: (value) => (value === "" ? "" : parseInt(value, 10)),
                })}
                type="number"
                min={1}
                error={form.formState.errors.number_needed?.message}
              />
            </Row>

            <Row>
              <Label htmlFor="number_orange">Balk oranje beneden</Label>
              <Input
                id="number_orange"
                {...form.register("number_orange", {
                  setValueAs: (value) => (value === "" ? 0 : parseInt(value, 10)),
                })}
                type="number"
                min={0}
                error={form.formState.errors.number_orange?.message}
              />
            </Row>

            <Row>
              <Label htmlFor="number_red">Balk rood beneden</Label>
              <Input
                id="number_red"
                {...form.register("number_red", {
                  setValueAs: (value) => (value === "" ? 0 : parseInt(value, 10)),
                })}
                type="number"
                min={0}
                error={form.formState.errors.number_red?.message}
              />
            </Row>

            <Row>
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                {...form.register("description")}
                placeholder="Optionele beschrijving van het vrijwilligerswerk"
                rows={3}
                error={form.formState.errors.description?.message}
              />
            </Row>
          </DetailBlock>
        </DetailCard>

        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={() =>
              navigate(
                isCreateMode
                  ? `/volunteering?${searchParams.toString()}`
                  : `/volunteering/${id}?${searchParams.toString()}`,
              )
            }
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

export default VolunteeringEdit;
