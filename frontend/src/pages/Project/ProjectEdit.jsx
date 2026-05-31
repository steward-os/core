import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CloseButton } from "../../components/Button/CloseButton";
import { Button } from "../../components/Button/Button";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import DetailBlock, { Label, Row } from "../../components/Detail/DetailBlock";
import DetailCard from "../../components/Detail/DetailCard";
import Input from "../../components/Form/Input";
import Select from "../../components/Form/Select";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import { projectSchema } from "../../schemas/projectSchema";
import { useProject, useCreateProject, useUpdateProject } from "../../hooks/crudResourceHooks";

const ProjectEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCreateMode = !id;

  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();

  const { data: project, isLoading: projectLoading, error } = useProject(id);

  const form = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: "", state: "open" },
  });

  useEffect(() => {
    if (!isCreateMode && project && !projectLoading) {
      form.reset({ name: project.name || "", state: project.state || "open" });
    }
  }, [isCreateMode, project, projectLoading, form]);

  const onSubmit = async (data) => {
    try {
      const projectData = { name: data.name, state: data.state };
      let result;
      if (isCreateMode) {
        result = await createProjectMutation.mutateAsync(projectData);
        await new Promise((resolve) => setTimeout(resolve, 100));
        navigate(`/projects/${result.id}?${searchParams.toString()}`);
      } else {
        await updateProjectMutation.mutateAsync({ id, data: projectData });
        await new Promise((resolve) => setTimeout(resolve, 100));
        navigate(`/projects/${id}?${searchParams.toString()}`);
      }
    } catch (error) {
      console.error("Error saving project:", error);
      alert("Er is een fout opgetreden bij het opslaan van het project.");
    }
  };

  if (!isCreateMode && projectLoading) return <CenteredSpinner />;
  if (error) return <CenteredAlert text={`Fout bij laden: ${error.message}`} />;
  if (!isCreateMode && !project) return <CenteredAlert text="Project niet gevonden." />;

  const cancelUrl = isCreateMode ? `/projects?${searchParams.toString()}` : `/projects/${id}?${searchParams.toString()}`;

  return (
    <PageContent fullWidth>
      <PageHeader title={isCreateMode ? "Nieuw project" : "Project bewerken"} variant="edit">
        <CloseButton onClick={() => navigate(cancelUrl)} size="normal" ariaLabel="Annuleren" />
      </PageHeader>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DetailCard title="Projectgegevens">
          <DetailBlock>
            <Row>
              <Label htmlFor="name">Naam</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Naam van het project"
                error={form.formState.errors.name?.message}
              />
            </Row>
            <Row>
              <Label htmlFor="state">Status</Label>
              <Select id="state" {...form.register("state")} error={form.formState.errors.state?.message}>
                <option value="open">Open</option>
                <option value="active">Actief</option>
                <option value="closed">Afgesloten</option>
              </Select>
            </Row>
          </DetailBlock>
        </DetailCard>

        <div className="flex gap-3">
          <Button type="button" onClick={() => navigate(cancelUrl)} color="gray" text="Annuleren" className="justify-center" />
          <Button
            type="submit"
            disabled={form.formState.isSubmitting || createProjectMutation.isPending || updateProjectMutation.isPending}
            color="blue"
            text={form.formState.isSubmitting ? "Opslaan..." : "Opslaan"}
            className="justify-center"
          />
        </div>
      </form>
    </PageContent>
  );
};

export default ProjectEdit;
