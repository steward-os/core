import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CloseButton } from "../../components/Button/CloseButton";
import PageHeader from "../../components/Page/PageHeader";
import PageContent from "../../components/Page/PageContent";
import { Button } from "../../components/Button/Button";
import Input from "../../components/Form/Input";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import DetailCard from "../../components/Detail/DetailCard";
import DetailBlock, { Row, Label } from "../../components/Detail/DetailBlock";
import {
  useStandardReaction,
  useCreateStandardReaction,
  useUpdateStandardReaction,
} from "../../hooks/useStandardReactionQuery";

const StandardReactionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCreateMode = !id;
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ emoji: "", reaction: "" });

  const { data: reaction, isLoading, error } = useStandardReaction(id);
  const createReactionMutation = useCreateStandardReaction();
  const updateReactionMutation = useUpdateStandardReaction();

  useEffect(() => {
    if (reaction && !isCreateMode) {
      setFormData({ emoji: reaction.emoji || "", reaction: reaction.reaction || "" });
    }
  }, [reaction, isCreateMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.emoji.trim()) { alert("Vul een emoji in."); return; }
    if (!formData.reaction.trim()) { alert("Vul een reactietekst in."); return; }
    setSaving(true);
    try {
      const data = { emoji: formData.emoji.trim(), reaction: formData.reaction.trim() };
      if (isCreateMode) {
        const result = await createReactionMutation.mutateAsync(data);
        navigate(`/standard-reactions/${result.id}?${searchParams.toString()}`);
      } else {
        await updateReactionMutation.mutateAsync({ id, data });
        navigate(`/standard-reactions/${id}?${searchParams.toString()}`);
      }
    } catch (error) {
      console.error("Error saving reaction:", error);
      alert("Er is een fout opgetreden bij het opslaan van de reactie.");
    }
    setSaving(false);
  };

  if (isLoading) return <CenteredSpinner />;
  if (!isCreateMode && error) return <CenteredAlert text={`Fout bij laden: ${error.message}`} />;
  if (!isCreateMode && !reaction && !isLoading) return <CenteredAlert text="Reactie niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader title={isCreateMode ? "Nieuwe reactie" : "Reactie bewerken"} variant="edit">
        <CloseButton
          onClick={() =>
            navigate(
              isCreateMode
                ? `/standard-reactions?${searchParams.toString()}`
                : `/standard-reactions/${id}?${searchParams.toString()}`
            )
          }
          size="normal"
          ariaLabel="Annuleren"
        />
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <DetailCard title="Reactie">
          <DetailBlock>
            <Row>
              <Label htmlFor="emoji">Emoji</Label>
              <Input
                id="emoji"
                name="emoji"
                placeholder="bijv. 👍"
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                className="max-w-2xl"
              />
            </Row>
            <Row>
              <Label htmlFor="reaction">Reactietekst</Label>
              <Input
                id="reaction"
                name="reaction"
                placeholder="bijv. Ik kom!"
                value={formData.reaction}
                onChange={(e) => setFormData({ ...formData, reaction: e.target.value })}
                className="max-w-2xl"
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
                  ? `/standard-reactions?${searchParams.toString()}`
                  : `/standard-reactions/${id}?${searchParams.toString()}`
              )
            }
            color="gray"
            text="Annuleren"
            className="w-full md:w-auto md:min-w-[160px] justify-center"
          />
          <Button
            type="submit"
            disabled={saving}
            color="blue"
            text={saving ? "Opslaan..." : "Opslaan"}
            className="w-full md:w-auto md:min-w-[160px] justify-center"
          />
        </div>
      </form>
    </PageContent>
  );
};

export default StandardReactionEdit;
