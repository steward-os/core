import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../../components/Button/BackButton";
import { Button } from "../../../components/Button/Button";
import { CloseButton } from "../../../components/Button/CloseButton";
import CenteredAlert from "../../../components/CenteredAlert";
import CenteredSpinner from "../../../components/CenteredSpinner";
import DetailBlock, { Label, Row } from "../../../components/Detail/DetailBlock";
import DetailCard from "../../../components/Detail/DetailCard";
import Checkbox from "../../../components/Form/Checkbox";
import Input from "../../../components/Form/Input";
import PageContent from "../../../components/Page/PageContent";
import PageHeader from "../../../components/Page/PageHeader";
import { useCreateFiscalYear, useUpdateFiscalYear } from "../../../hooks/crudResourceHooks";
import { getFiscalYear } from "../../../services/fiscalYearService";

const FiscalYearEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCreateMode = !id;
  const createMutation = useCreateFiscalYear();
  const updateMutation = useUpdateFiscalYear();

  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    year_name: "",
    start_date: "",
    end_date: "",
    is_locked: false,
  });

  useEffect(() => {
    if (isCreateMode) return;
    setLoading(true);
    getFiscalYear(id)
      .then((data) => {
        setFormData({
          year_name: data.year_name || "",
          start_date: data.start_date?.slice(0, 10) || "",
          end_date: data.end_date?.slice(0, 10) || "",
          is_locked: !!data.is_locked,
        });
      })
      .catch((err) => { if (!err?.isAbort) setError(err?.message || "Boekjaar niet gevonden."); })
      .finally(() => setLoading(false));
  }, [id, isCreateMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isCreateMode) {
        await createMutation.mutateAsync(formData);
        navigate(`/finance/fiscal-years?${searchParams.toString()}`);
      } else {
        await updateMutation.mutateAsync({ id, data: formData });
        navigate(`/finance/fiscal-years?${searchParams.toString()}`);
      }
    } catch (err) {
      console.error("Error saving fiscal year:", err);
      alert("Er is een fout opgetreden bij het opslaan.");
    }
    setSaving(false);
  };

  if (loading) return <CenteredSpinner />;
  if (error) return <CenteredAlert text={error} />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title={isCreateMode ? "Nieuw boekjaar" : "Boekjaar bewerken"}
        variant="edit"
        backButton={
          <BackButton onClick={() => navigate(`/finance/fiscal-years?${searchParams.toString()}`)} ariaLabel="Terug naar boekjaren" />
        }
      >
        <CloseButton
          onClick={() => navigate(`/finance/fiscal-years?${searchParams.toString()}`)}
          size="normal"
          ariaLabel="Annuleren"
        />
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <DetailCard title="Boekjaargegevens">
          <DetailBlock>
            <Row>
              <Label htmlFor="year_name" required>
                Naam
              </Label>
              <Input
                id="year_name"
                value={formData.year_name}
                onChange={(e) => setFormData({ ...formData, year_name: e.target.value })}
                placeholder="Bijv. 2025"
                required
              />
            </Row>

            <Row>
              <Label htmlFor="start_date" required>
                Startdatum
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </Row>

            <Row>
              <Label htmlFor="end_date" required>
                Einddatum
              </Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                required
              />
            </Row>

            <Row>
              <Label htmlFor="is_locked">Vergrendeld</Label>
              <div className="pt-1">
                <Checkbox
                  id="is_locked"
                  checked={formData.is_locked}
                  onChange={(e) => setFormData({ ...formData, is_locked: e.target.checked })}
                />
              </div>
            </Row>
          </DetailBlock>
        </DetailCard>

        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={() => navigate(`/finance/fiscal-years?${searchParams.toString()}`)}
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

export default FiscalYearEdit;
