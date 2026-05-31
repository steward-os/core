import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { getBanner, createBanner, updateBanner } from "../../services/bannerService";

const BannerEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreateMode = !id;
  const [banner, setBanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ message: "", link: "", active: false });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (!isCreateMode) {
          const bannerData = await getBanner(id);
          setBanner(bannerData);
          setFormData({ message: bannerData.message || "", link: bannerData.link || "", active: bannerData.active || false });
        }
      } catch (error) {
        console.error("Error fetching banner:", error);
      }
      setLoading(false);
    };
    loadData();
  }, [id, isCreateMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.message.trim()) { alert("Vul een bericht in."); return; }
    setSaving(true);
    try {
      const bannerData = { message: formData.message, link: formData.link || null, active: formData.active };
      let result;
      if (isCreateMode) {
        result = await createBanner(bannerData);
        await new Promise((resolve) => setTimeout(resolve, 100));
        navigate(`/banners/${result.id}`);
      } else {
        result = await updateBanner(id, bannerData);
        await new Promise((resolve) => setTimeout(resolve, 100));
        navigate(`/banners/${id}`);
      }
    } catch (error) {
      console.error("Error saving banner:", error);
      alert("Er is een fout opgetreden bij het opslaan van het bericht.");
    }
    setSaving(false);
  };

  if (loading) return <CenteredSpinner />;
  if (!isCreateMode && !banner && !loading) return <CenteredAlert text="Banner bericht niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title={isCreateMode ? "Nieuw banner bericht" : "Banner bericht bewerken"}
        variant="edit"
      >
        <CloseButton
          onClick={() => navigate(isCreateMode ? "/banners" : `/banners/${id}`)}
          size="normal"
          ariaLabel="Annuleren"
        />
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <DetailCard title="Bericht">
          <DetailBlock>
            <Row>
              <Label htmlFor="message">Bericht</Label>
              <div className="max-w-2xl">
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Voer het bericht in"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                />
                <p className="mt-1 text-xs text-[var(--text-secondary)]">HTML opmaak is toegestaan voor simpele styling.</p>
              </div>
            </Row>
            <Row>
              <Label htmlFor="link">Link</Label>
              <div className="max-w-2xl">
                <Input
                  id="link"
                  name="link"
                  placeholder="bijv. /volunteering"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                />
                <p className="mt-1 text-xs text-[var(--text-secondary)]">Een link waar gebruikers naartoe kunnen gaan voor meer informatie.</p>
              </div>
            </Row>
            <Row>
              <Label htmlFor="active">Actief</Label>
              <div className="flex items-center pt-1">
                <input
                  id="active"
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </Row>
          </DetailBlock>
        </DetailCard>

        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={() => navigate(isCreateMode ? "/banners" : `/banners/${id}`)}
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

export default BannerEdit;
