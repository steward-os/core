import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
import { useRelationTag, useCreateRelationTag, useUpdateRelationTag } from "../../hooks/useRelationTagQuery";

const TagEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCreateMode = !id;
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ name: "", description: "", color: "#3B82F6" });

  const { data: tag, isLoading, error } = useRelationTag(id, {}, { enabled: !isCreateMode });
  const createTagMutation = useCreateRelationTag();
  const updateTagMutation = useUpdateRelationTag();

  useEffect(() => {
    if (tag && !isCreateMode) {
      setFormData({
        name: tag.name || "",
        description: tag.description || "",
        color: tag.color || "#3B82F6",
        type: tag.type || "",
      });
    }
  }, [tag, isCreateMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Vul een naam in voor de tag.");
      return;
    }
    setSaving(true);
    try {
      const tagData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        color: formData.color || null,
        type: formData.type.trim() || null,
      };
      if (isCreateMode) {
        const result = await createTagMutation.mutateAsync(tagData);
        navigate(`/tags/${result.id}?${searchParams.toString()}`);
      } else {
        await updateTagMutation.mutateAsync({ id, data: tagData });
        navigate(`/tags/${id}?${searchParams.toString()}`);
      }
    } catch (error) {
      console.error("Error saving tag:", error);
      alert("Er is een fout opgetreden bij het opslaan van de tag.");
    }
    setSaving(false);
  };

  if (isLoading) return <CenteredSpinner />;
  if (!isCreateMode && error) return <CenteredAlert text={`Fout bij laden: ${error.message}`} />;
  if (!isCreateMode && !tag && !isLoading) return <CenteredAlert text="Tag niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader title={isCreateMode ? "Nieuwe tag" : "Tag bewerken"} variant="edit">
        <CloseButton
          onClick={() =>
            navigate(isCreateMode ? `/tags?${searchParams.toString()}` : `/tags/${id}?${searchParams.toString()}`)
          }
          size="normal"
          ariaLabel="Annuleren"
        />
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <DetailCard title="Tag informatie">
          <DetailBlock>
            <Row>
              <Label htmlFor="name">Naam</Label>
              <Input
                id="name"
                name="name"
                placeholder="Naam van de tag"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="max-w-2xl"
              />
            </Row>
            <Row>
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Korte beschrijving van wat deze tag betekent"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="max-w-2xl"
              />
            </Row>
            <Row>
              <Label htmlFor="color">Kleur</Label>
              <div className="flex items-center gap-3 max-w-2xl">
                <Input
                  id="color"
                  name="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-16 h-10 p-1"
                />

                <Input
                  type="text"
                  placeholder="#3B82F6"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="font-mono flex-1"
                />
              </div>
            </Row>

            <Row>
              <Label>Type</Label>
              <Input
                type="text"
                placeholder=""
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="font-mono flex-1"
              />
            </Row>
          </DetailBlock>
        </DetailCard>

        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={() =>
              navigate(isCreateMode ? `/tags?${searchParams.toString()}` : `/tags/${id}?${searchParams.toString()}`)
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

export default TagEdit;
