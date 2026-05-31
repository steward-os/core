import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../../components/Button/BackButton";
import { Button } from "../../../components/Button/Button";
import { CloseButton } from "../../../components/Button/CloseButton";
import CenteredAlert from "../../../components/CenteredAlert";
import CenteredSpinner from "../../../components/CenteredSpinner";
import DetailBlock, { Label, Row } from "../../../components/Detail/DetailBlock";
import DetailCard from "../../../components/Detail/DetailCard";
import Input from "../../../components/Form/Input";
import Select from "../../../components/Form/Select";
import Textarea from "../../../components/Form/Textarea";
import PageContent from "../../../components/Page/PageContent";
import PageHeader from "../../../components/Page/PageHeader";
import { useCreateBankStatementLine, useUpdateBankStatementLine } from "../../../hooks/crudResourceHooks";
import { getBankStatementLine } from "../../../services/bankStatementService";
import { BANK_STATEMENT_STATUS_LABELS } from "../../../utils/financeConstants";

const BankStatementLineEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCreateMode = !id;
  const createMutation = useCreateBankStatementLine();
  const updateMutation = useUpdateBankStatementLine();

  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    date: "",
    amount: "",
    description: "",
    status: "",
  });

  useEffect(() => {
    if (isCreateMode) return;
    setLoading(true);
    getBankStatementLine(id)
      .then((data) => {
        setFormData({
          date: data.date?.slice(0, 10) || "",
          amount: data.amount !== undefined ? String(data.amount) : "",
          description: data.description || "",
          status: data.status || "",
        });
      })
      .catch((err) => {
        if (!err?.isAbort) setError(err?.message || "Bankafschriftregel niet gevonden.");
      })
      .finally(() => setLoading(false));
  }, [id, isCreateMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...formData,
        amount: formData.amount !== "" ? parseFloat(formData.amount) : null,
      };
      if (isCreateMode) {
        await createMutation.mutateAsync(payload);
        navigate(`/finance/bank-statement-lines?${searchParams.toString()}`);
      } else {
        await updateMutation.mutateAsync({ id, data: payload });
        navigate(`/finance/bank-statement-lines?${searchParams.toString()}`);
      }
    } catch (err) {
      console.error("Error saving bank statement line:", err);
      alert("Er is een fout opgetreden bij het opslaan.");
    }
    setSaving(false);
  };

  if (loading) return <CenteredSpinner />;
  if (error) return <CenteredAlert text={error} />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title={isCreateMode ? "Nieuwe bankafschriftregel" : "Bankafschriftregel bewerken"}
        variant="edit"
        backButton={
          <BackButton onClick={() => navigate(`/finance/bank-statement-lines?${searchParams.toString()}`)} ariaLabel="Terug naar bankafschriften" />
        }
      >
        <CloseButton
          onClick={() => navigate(`/finance/bank-statement-lines?${searchParams.toString()}`)}
          size="normal"
          ariaLabel="Annuleren"
        />
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <DetailCard title="Transactiegegevens">
          <DetailBlock>
            <Row>
              <Label htmlFor="date" required>
                Datum
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </Row>

            <Row>
              <Label htmlFor="amount" required>
                Bedrag (€)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </Row>

            <Row>
              <Label htmlFor="description">Omschrijving</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Omschrijving van de transactie"
              />
            </Row>

            <Row>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="">Selecteer status (optioneel)</option>
                {Object.entries(BANK_STATEMENT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Row>
          </DetailBlock>
        </DetailCard>

        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={() => navigate(`/finance/bank-statement-lines?${searchParams.toString()}`)}
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

export default BankStatementLineEdit;
