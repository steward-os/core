import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../components/Button/BackButton";
import { EditButton } from "../../components/Button/EditButton";
import { DeleteButton } from "../../components/Button/DeleteButton";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import DetailCard from "../../components/Detail/DetailCard";
import DetailBlock, { Row, Label, Value } from "../../components/Detail/DetailBlock";
import { useStandardReaction, useDeleteStandardReaction } from "../../hooks/useStandardReactionQuery";

const StandardReactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deleteReactionMutation = useDeleteStandardReaction();
  const { data: reaction, isLoading, error } = useStandardReaction(id);

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je deze reactie wilt verwijderen?")) return;
    try {
      await deleteReactionMutation.mutateAsync(id);
      navigate(`/standard-reactions?${searchParams.toString()}`);
    } catch (error) {
      console.error("Error deleting reaction:", error);
      alert("Er is een fout opgetreden bij het verwijderen van de reactie.");
    }
  };

  if (isLoading) return <CenteredSpinner />;
  if (error) return <CenteredAlert text={`Fout bij laden: ${error.message}`} />;
  if (!reaction) return <CenteredAlert text="Reactie niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title={`${reaction.emoji} ${reaction.reaction}`}
        backButton={
          <BackButton
            onClick={() => navigate(`/standard-reactions?${searchParams.toString()}`)}
            ariaLabel="Terug naar reacties"
          />
        }
      >
        <EditButton
          onClick={() => navigate(`/standard-reactions/${id}/edit?${searchParams.toString()}`)}
          showText
          size="normal"
          ariaLabel="Reactie bewerken"
        />
        <DeleteButton onClick={handleDelete} showText size="normal" ariaLabel="Reactie verwijderen" />
      </PageHeader>

      <div className="space-y-6">
        <DetailCard title="Reactie">
          <DetailBlock>
            <Row>
              <Label>Emoji</Label>
              <Value><span className="text-2xl">{reaction.emoji}</span></Value>
            </Row>
            <Row>
              <Label>Reactietekst</Label>
              <Value>{reaction.reaction}</Value>
            </Row>
            <Row>
              <Label>Aangemaakt</Label>
              <Value>{new Date(reaction.created).toLocaleString("nl-NL")}</Value>
            </Row>
            <Row>
              <Label>Laatst bijgewerkt</Label>
              <Value>{new Date(reaction.updated).toLocaleString("nl-NL")}</Value>
            </Row>
          </DetailBlock>
        </DetailCard>
      </div>
    </PageContent>
  );
};

export default StandardReactionDetail;
