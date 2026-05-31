import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BackButton } from "../../../components/Button/BackButton";
import { Button } from "../../../components/Button/Button";
import { CloseButton } from "../../../components/Button/CloseButton";
import CenteredAlert from "../../../components/CenteredAlert";
import CenteredSpinner from "../../../components/CenteredSpinner";
import DetailBlock, { Label, Row } from "../../../components/Detail/DetailBlock";
import DetailCard from "../../../components/Detail/DetailCard";
import Input from "../../../components/Form/Input";
import Select from "../../../components/Form/Select";
import PageContent from "../../../components/Page/PageContent";
import PageHeader from "../../../components/Page/PageHeader";
import { useBatchRun, useCreateBatchRun, useUpdateBatchRun } from "../../../hooks/crudResourceHooks";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Concept" },
  { value: "PROCESSING", label: "Verwerking" },
  { value: "COMPLETED", label: "Voltooid" },
  { value: "FAILED", label: "Mislukt" },
];

const BatchRunEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreateMode = !id;
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    run_date: "",
    description: "",
    type: "",
    status: "DRAFT",
    total_amount: "",
  });

  const { data: batchRun, isLoading, error } = useBatchRun(id, {}, { enabled: !isCreateMode });
  const createMutation = useCreateBatchRun();
  const updateMutation = useUpdateBatchRun();

  useEffect(() => {
    if (batchRun && !isCreateMode) {
      setFormData({
        run_date: batchRun.run_date ? batchRun.run_date.split("T")[0] : "",
        description: batchRun.description || "",
        type: batchRun.type || "",
        status: batchRun.status || "DRAFT",
        total_amount: batchRun.total_amount != null ? String(batchRun.total_amount) : "",
      });
    }
  }, [batchRun, isCreateMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description.trim()) {
      alert("Vul een omschrijving in.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        run_date: formData.run_date || null,
        description: formData.description.trim(),
        type: formData.type.trim() || null,
        status: formData.status,
        total_amount: formData.total_amount !== "" ? parseFloat(formData.total_amount) : null,
      };

      let result;
      if (isCreateMode) {
        result = await createMutation.mutateAsync(payload);
        navigate(`/finance/batch-runs/${result.id}`);
      } else {
        await updateMutation.mutateAsync({ id, data: payload });
        navigate(`/finance/batch-runs/${id}`);
      }
    } catch (err) {
      console.error("Error saving batch run:", err);
      alert("Er is een fout opgetreden bij het opslaan.");
    }
    setSaving(false);
  };

  if (isLoading) return <CenteredSpinner />;
  if (!isCreateMode && error) return <CenteredAlert text={`Fout bij laden: ${error.message}`} />;
  if (!isCreateMode && !batchRun && !isLoading) return <CenteredAlert text="Batchrun niet gevonden." />;

  const field = (key) => ({
    value: formData[key],
    onChange: (e) => setFormData({ ...formData, [key]: e.target.value }),
  });

  return (
    <PageContent>
      <PageHeader
        title={isCreateMode ? "Nieuwe batchrun" : "Batchrun bewerken"}
        variant="edit"
        backButton={
          <BackButton
            onClick={() => navigate(isCreateMode ? "/finance/batch-runs" : `/finance/batch-runs/${id}`)}
            ariaLabel="Terug"
          />
        }
      >
        <CloseButton
          onClick={() =>
            navigate(isCreateMode ? "/finance/batch-runs" : `/finance/batch-runs/${id}`)
          }
          size="normal"
          ariaLabel="Annuleren"
        />
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <DetailCard title="Batchrun">
          <DetailBlock>
            <Row>
              <Label htmlFor="run_date">Datum</Label>
              <Input id="run_date" name="run_date" type="date" {...field("run_date")} />
            </Row>
            <Row>
              <Label htmlFor="description">Omschrijving</Label>
              <Input
                id="description"
                name="description"
                placeholder="Omschrijving van de batchrun"
                required
                {...field("description")}
              />
            </Row>
            <Row>
              <Label htmlFor="type">Type</Label>
              <Input
                id="type"
                name="type"
                placeholder="Bijv. SEPA, INVOICE, PAYMENT"
                {...field("type")}
              />
            </Row>
            <Row>
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" {...field("status")}>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Row>
            <Row>
              <Label htmlFor="total_amount">Totaalbedrag</Label>
              <Input
                id="total_amount"
                name="total_amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...field("total_amount")}
              />
            </Row>
          </DetailBlock>
        </DetailCard>

        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={() =>
              navigate(isCreateMode ? "/finance/batch-runs" : `/finance/batch-runs/${id}`)
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

export default BatchRunEdit;
