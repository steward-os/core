import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../components/Button/BackButton";
import { DeleteButton } from "../../components/Button/DeleteButton";
import { EditButton } from "../../components/Button/EditButton";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import RelationDetailContent from "../../features/relations/RelationDetailContent";
import { useDeleteRelation, useRelation } from "../../hooks/crudResourceHooks";

const RelationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deleteRelationMutation = useDeleteRelation();

  const { data: relation, isLoading, error } = useRelation(id);

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je deze relatie wilt verwijderen?")) return;
    try {
      await deleteRelationMutation.mutateAsync(id);
      navigate(`/relations?${searchParams.toString()}`);
    } catch {
      alert("Er is een fout opgetreden bij het verwijderen van de relatie.");
    }
  };

  if (isLoading) return <CenteredSpinner />;
  if (error) return <CenteredAlert text={`Fout bij laden: ${error.message}`} />;
  if (!relation) return <CenteredAlert text="Relatie niet gevonden." />;

  const fullName = [relation.first_name, relation.last_name].filter(Boolean).join(" ") || "-";

  return (
    <PageContent fullWidth>
      <PageHeader
        title={fullName}
        backButton={
          <BackButton
            onClick={() => navigate(`/relations?${searchParams.toString()}`)}
            ariaLabel="Terug naar relaties"
          />
        }
      >
        <EditButton
          onClick={() => navigate(`/relations/${id}/edit?${searchParams.toString()}`)}
          showText
          size="normal"
          ariaLabel="Relatie bewerken"
        />
        <DeleteButton onClick={handleDelete} showText size="normal" ariaLabel="Relatie verwijderen" />
      </PageHeader>

      <RelationDetailContent relation={relation} id={id} />
    </PageContent>
  );
};

export default RelationDetail;
