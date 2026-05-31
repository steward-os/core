import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../components/Button/BackButton";
import { DeleteButton } from "../../components/Button/DeleteButton";
import { EditButton } from "../../components/Button/EditButton";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import ProjectDetailContent from "../../features/projects/ProjectDetailContent";
import { useDeleteProject, useProject } from "../../hooks/crudResourceHooks";

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deleteProjectMutation = useDeleteProject();

  const { data: project, isLoading, error } = useProject(id);

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je dit project wilt verwijderen?")) return;
    try {
      await deleteProjectMutation.mutateAsync(project.id);
      navigate(`/projects?${searchParams.toString()}`);
    } catch (e) {
      alert("Er is een fout opgetreden bij het verwijderen van het project.", e);
    }
  };

  if (isLoading) return <CenteredSpinner />;
  if (error) return <CenteredAlert text={`Fout bij laden project: ${error.message}`} />;
  if (!project) return <CenteredAlert text="Project niet gevonden" />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title={project.name}
        backButton={
          <BackButton
            onClick={() => navigate(`/projects?${searchParams.toString()}`)}
            showText
            ariaLabel="Terug naar projecten"
          />
        }
      >
        <EditButton
          onClick={() => navigate(`/projects/${id}/edit?${searchParams.toString()}`)}
          showText
          size="normal"
          ariaLabel="Project bewerken"
        />
        <DeleteButton onClick={handleDelete} size="normal" ariaLabel="Project verwijderen" />
      </PageHeader>

      <ProjectDetailContent project={project} id={id} />
    </PageContent>
  );
};

export default ProjectDetail;
