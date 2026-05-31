import { CloseButton } from "../../components/Button/CloseButton";
import PageHeader from "../../components/Page/PageHeader";
import PageContent from "../../components/Page/PageContent";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../components/Button/Button";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import Input from "../../components/Form/Input";
import DetailCard from "../../components/Detail/DetailCard";
import DetailBlock, { Row, Label } from "../../components/Detail/DetailBlock";
import pb from "../../pb";

const MusicRecordingEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreateMode = !id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recordingNotFound, setRecordingNotFound] = useState(false);
  const [formData, setFormData] = useState({ title: "", youtube_id: "", offset: 0 });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadData = async () => {
      if (isCreateMode) { setLoading(false); return; }
      setLoading(true);
      try {
        const recordingData = await pb.collection("mb_music_recordings").getOne(id);
        setFormData({
          title: recordingData.title || "",
          youtube_id: recordingData.youtube_id || "",
          offset: recordingData.offset || 0,
        });
        setRecordingNotFound(false);
      } catch (e) {
        console.error("Error fetching recording:", e, "ID:", id);
        setRecordingNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id, isCreateMode]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Titel is verplicht";
    if (!formData.youtube_id.trim()) newErrors.youtube_id = "YouTube ID is verplicht";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const recordingData = {
        title: formData.title,
        youtube_id: formData.youtube_id,
        offset: parseFloat(formData.offset) || 0,
      };
      if (isCreateMode) {
        const result = await pb.collection("mb_music_recordings").create(recordingData);
        navigate(`/music-recordings-admin/${result.id}`);
      } else {
        await pb.collection("mb_music_recordings").update(id, recordingData);
        navigate(`/music-recordings-admin/${id}`);
      }
    } catch (error) {
      console.error("Error saving recording:", error);
      alert("Fout bij opslaan. Probeer het opnieuw.");
    }
    setSaving(false);
  };

  if (loading) return <CenteredSpinner />;
  if (recordingNotFound) return <CenteredAlert text="Opname niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader title={isCreateMode ? "Nieuwe opname" : "Opname bewerken"} variant="edit">
        <CloseButton
          onClick={() => navigate(isCreateMode ? "/music-recordings-admin" : `/music-recordings-admin/${id}`)}
          size="normal"
          ariaLabel="Annuleren"
        />
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <DetailCard title="Opname details">
          <DetailBlock>
            <Row>
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Titel van het muziekstuk"
                error={errors.title}
                className="max-w-2xl"
              />
            </Row>
            <Row>
              <Label htmlFor="youtube_id">YouTube ID</Label>
              <div className="max-w-2xl">
                <Input
                  id="youtube_id"
                  value={formData.youtube_id}
                  onChange={(e) => setFormData({ ...formData, youtube_id: e.target.value })}
                  placeholder="bijv. dQw4w9WgXcQ"
                  error={errors.youtube_id}
                />
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Het YouTube ID vind je in de URL na &quot;v=&quot;.
                </p>
              </div>
            </Row>
            <Row>
              <Label htmlFor="offset">Offset (seconden)</Label>
              <div className="max-w-2xl">
                <Input
                  id="offset"
                  type="number"
                  value={formData.offset}
                  onChange={(e) => setFormData({ ...formData, offset: e.target.value })}
                  placeholder="0"
                  step="0.1"
                />
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  Start de opname op dit moment (in seconden).
                </p>
              </div>
            </Row>
          </DetailBlock>
        </DetailCard>

        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={() => navigate(isCreateMode ? "/music-recordings-admin" : `/music-recordings-admin/${id}`)}
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

export default MusicRecordingEdit;
