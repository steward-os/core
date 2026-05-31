import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../components/Button/BackButton";
import { DeleteButton } from "../../components/Button/DeleteButton";
import { EditButton } from "../../components/Button/EditButton";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import ActionDetailContent from "../../features/actions/ActionDetailContent";
import ActionEditModal from "../../features/actions/ActionEditModal";
import { useBsAction, useDeleteBsAction } from "../../hooks/crudResourceHooks";

const ActionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const deleteActionMutation = useDeleteBsAction();

  const { data: action, isLoading, error } = useBsAction(id, { expand: "assigned_to,tags" });

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je deze actie wilt verwijderen?")) return;
    try {
      await deleteActionMutation.mutateAsync(id);
      navigate(`/actions?${searchParams.toString()}`);
    } catch {
      alert("Er is een fout opgetreden bij het verwijderen van de actie.");
    }
  };

  if (isLoading) return <CenteredSpinner />;
  if (error) return <CenteredAlert text={`Fout bij laden: ${error.message}`} />;
  if (!action) return <CenteredAlert text="Actie niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title={action.name}
        backButton={
          <BackButton
            onClick={() => navigate(`/actions?${searchParams.toString()}`)}
            ariaLabel="Terug naar acties"
          />
        }
      >
        <EditButton
          onClick={() => setEditModalOpen(true)}
          showText
          size="normal"
          ariaLabel="Actie bewerken"
        />
        <DeleteButton onClick={handleDelete} showText size="normal" ariaLabel="Actie verwijderen" />
      </PageHeader>

      <ActionDetailContent action={action} id={id} showCards />

      <ActionEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        id={id}
      />
    </PageContent>
  );
};

export default ActionDetail;
