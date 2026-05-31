import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../../components/Button/BackButton";
import { Button } from "../../../components/Button/Button";
import { CloseButton } from "../../../components/Button/CloseButton";
import CenteredSpinner from "../../../components/CenteredSpinner";
import DetailBlock, { Label, Row } from "../../../components/Detail/DetailBlock";
import DetailCard from "../../../components/Detail/DetailCard";
import Input from "../../../components/Form/Input";
import Select from "../../../components/Form/Select";
import Textarea from "../../../components/Form/Textarea";
import PageContent from "../../../components/Page/PageContent";
import PageHeader from "../../../components/Page/PageHeader";
import { useCreateJournalTransaction, useUpdateJournalTransaction } from "../../../hooks/crudResourceHooks";
import { getAllFiscalYears } from "../../../services/fiscalYearService";
import { getJournalTransaction, getJournalTransactions } from "../../../services/journalTransactionService";
import { TRANSACTION_TYPE_LABELS } from "../../../utils/financeConstants";

function nextEntryNumber(last) {
  const currentYear = new Date().getFullYear();
  if (!last) return `${currentYear}-001`;
  const match = last.match(/^(\d{4})-(\d+)$/);
  if (!match) return "";
  const year = parseInt(match[1]);
  const num = parseInt(match[2]);
  if (year === currentYear) return `${currentYear}-${String(num + 1).padStart(3, "0")}`;
  return `${currentYear}-001`; // new calendar year, restart
}

const JournalTransactionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCreateMode = !id;
  const createMutation = useCreateJournalTransaction();
  const updateMutation = useUpdateJournalTransaction();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [formData, setFormData] = useState({
    entry_number: "",
    transaction_date: "",
    description: "",
    fiscal_year: "",
    transaction_type: "MEMORIAL",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [years, lastPage] = await Promise.all([
          getAllFiscalYears({ sort: "-start_date" }),
          isCreateMode ? getJournalTransactions(1, 1, { sort: "-created" }) : Promise.resolve(null),
        ]);
        setFiscalYears(years);
        if (isCreateMode) {
          const lastNumber = lastPage?.items?.[0]?.entry_number ?? null;
          setFormData((prev) => ({ ...prev, entry_number: nextEntryNumber(lastNumber) }));
        }
        if (!isCreateMode) {
          const data = await getJournalTransaction(id);
          setFormData({
            entry_number: data.entry_number || "",
            transaction_date: data.transaction_date?.slice(0, 10) || "",
            description: data.description || "",
            fiscal_year: data.fiscal_year || "",
            transaction_type: data.transaction_type || "MEMORIAL",
          });
        }
      } catch (err) {
        if (err?.isAbort) return;
        console.error("Error loading journal transaction data:", err);
        setError(err);
      }
      setLoading(false);
    };
    load();
  }, [id, isCreateMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isCreateMode) {
        const result = await createMutation.mutateAsync(formData);
        navigate(`/finance/journal-transactions/${result.id}?${searchParams.toString()}`);
      } else {
        await updateMutation.mutateAsync({ id, data: formData });
        navigate(`/finance/journal-transactions/${id}?${searchParams.toString()}`);
      }
    } catch (err) {
      console.error("Error saving journal transaction:", err);
      alert("Er is een fout opgetreden bij het opslaan.");
    }
    setSaving(false);
  };

  if (loading) return <CenteredSpinner />;
  if (error)
    return (
      <PageContent fullWidth>
        <div className="m-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm">
          <p className="font-semibold text-red-700 dark:text-red-400 mb-2">Fout bij laden van gegevens</p>
          <p className="text-red-600 dark:text-red-300 mb-1">{error.message}</p>
          {error.status && <p className="text-red-500 dark:text-red-400">HTTP status: {error.status}</p>}
          {error.response?.message && error.response.message !== error.message && (
            <p className="text-red-500 dark:text-red-400">Server: {error.response.message}</p>
          )}
          {error.response?.data && Object.keys(error.response.data).length > 0 && (
            <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded text-xs text-red-700 dark:text-red-300 overflow-auto">
              {JSON.stringify(error.response.data, null, 2)}
            </pre>
          )}
        </div>
      </PageContent>
    );

  return (
    <PageContent fullWidth>
      <PageHeader
        title={isCreateMode ? "Nieuwe boeking" : "Boeking bewerken"}
        variant="edit"
        backButton={
          <BackButton
            onClick={() =>
              navigate(
                isCreateMode
                  ? `/finance/journal-transactions?${searchParams.toString()}`
                  : `/finance/journal-transactions/${id}?${searchParams.toString()}`,
              )
            }
            ariaLabel="Terug"
          />
        }
      >
        <CloseButton
          onClick={() =>
            navigate(
              isCreateMode
                ? `/finance/journal-transactions?${searchParams.toString()}`
                : `/finance/journal-transactions/${id}?${searchParams.toString()}`,
            )
          }
          size="normal"
          ariaLabel="Annuleren"
        />
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <DetailCard title="Boekingsgegevens">
          <DetailBlock>
            <Row>
              <Label htmlFor="entry_number">Boekingsnummer</Label>
              <Input
                id="entry_number"
                value={formData.entry_number}
                onChange={(e) => setFormData({ ...formData, entry_number: e.target.value })}
                placeholder="Bijv. 2025-001"
              />
            </Row>

            <Row>
              <Label htmlFor="fiscal_year">Boekjaar</Label>
              <Select
                id="fiscal_year"
                value={formData.fiscal_year}
                onChange={(e) => setFormData({ ...formData, fiscal_year: e.target.value })}
              >
                <option value="">Selecteer boekjaar (optioneel)</option>
                {fiscalYears.map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.year_name}
                  </option>
                ))}
              </Select>
            </Row>

            <Row>
              <Label htmlFor="transaction_date" required>
                Boekingsdatum
              </Label>
              <Input
                id="transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
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
                placeholder="Omschrijving van de boeking"
              />
            </Row>

            <Row>
              <Label htmlFor="transaction_type">Transactietype</Label>
              <Select
                id="transaction_type"
                value={formData.transaction_type}
                onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
              >
                {Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => (
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
            onClick={() =>
              navigate(
                isCreateMode
                  ? `/finance/journal-transactions?${searchParams.toString()}`
                  : `/finance/journal-transactions/${id}?${searchParams.toString()}`,
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

export default JournalTransactionEdit;
