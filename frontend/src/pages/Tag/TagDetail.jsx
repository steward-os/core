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
import { useRelationTag, useDeleteRelationTag } from "../../hooks/useRelationTagQuery";

const TagDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deleteTagMutation = useDeleteRelationTag();
  const { data: tag, isLoading, error } = useRelationTag(id);

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je deze tag wilt verwijderen?")) return;
    try {
      await deleteTagMutation.mutateAsync(id);
      navigate(`/tags?${searchParams.toString()}`);
    } catch (error) {
      console.error("Error deleting tag:", error);
      alert("Er is een fout opgetreden bij het verwijderen van de tag.");
    }
  };

  if (isLoading) return <CenteredSpinner />;
  if (error) return <CenteredAlert text={`Fout bij laden: ${error.message}`} />;
  if (!tag) return <CenteredAlert text="Tag niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title={tag.name}
        backButton={
          <BackButton
            onClick={() => navigate(`/tags?${searchParams.toString()}`)}
            ariaLabel="Terug naar tags"
          />
        }
      >
        <EditButton
          onClick={() => navigate(`/tags/${id}/edit?${searchParams.toString()}`)}
          showText
          size="normal"
          ariaLabel="Tag bewerken"
        />
        <DeleteButton onClick={handleDelete} showText size="normal" ariaLabel="Tag verwijderen" />
      </PageHeader>

      <div className="space-y-6">
        <DetailCard title="Tag informatie">
          <DetailBlock>
            <Row>
              <Label>Naam</Label>
              <Value>{tag.name}</Value>
            </Row>
            <Row>
              <Label>Beschrijving</Label>
              <Value>{tag.description || "-"}</Value>
            </Row>
            <Row>
              <Label>Kleur</Label>
              <Value>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-[var(--glass-border)]"
                    style={{ backgroundColor: tag.color || "#3B82F6" }}
                  />
                  <span className="font-mono text-sm">{tag.color || "#3B82F6"}</span>
                </div>
              </Value>
            </Row>
            <Row>
              <Label>Preview</Label>
              <Value>
                <span
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: tag.color || "#3B82F6" }}
                >
                  {tag.name}
                </span>
              </Value>
            </Row>
            <Row>
              <Label>Aangemaakt</Label>
              <Value>{new Date(tag.created).toLocaleString("nl-NL")}</Value>
            </Row>
            <Row>
              <Label>Laatst bijgewerkt</Label>
              <Value>{new Date(tag.updated).toLocaleString("nl-NL")}</Value>
            </Row>
          </DetailBlock>
        </DetailCard>
      </div>
    </PageContent>
  );
};

export default TagDetail;
