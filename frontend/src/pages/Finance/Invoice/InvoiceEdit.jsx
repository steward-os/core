import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import posthog from "../../../posthog";
import { BackButton } from "../../../components/Button/BackButton";
import { Button } from "../../../components/Button/Button";
import { CloseButton } from "../../../components/Button/CloseButton";
import CenteredAlert from "../../../components/CenteredAlert";
import CenteredSpinner from "../../../components/CenteredSpinner";
import DetailBlock, { Label, Row } from "../../../components/Detail/DetailBlock";
import DetailCard from "../../../components/Detail/DetailCard";
import FormFieldSelectAjax from "../../../components/Form/FormFieldSelectAjax";
import Input from "../../../components/Form/Input";
import Select from "../../../components/Form/Select";
import Textarea from "../../../components/Form/Textarea";
import PageContent from "../../../components/Page/PageContent";
import PageHeader from "../../../components/Page/PageHeader";
import { useCreateSalesInvoice, useUpdateSalesInvoice } from "../../../hooks/crudResourceHooks";
import {
  createInvoiceLine,
  deleteInvoiceLine,
  getInvoiceLines,
  updateInvoiceLine,
} from "../../../services/invoiceLineService";
import { getAllLedgerAccounts } from "../../../services/ledgerAccountService";
import { getNextInvoiceNumber, getSalesInvoice } from "../../../services/salesInvoiceService";
import { STATUS_OPTIONS } from "./invoiceConstants";

let nextKey = 1;
const newEmptyLine = () => ({ _key: nextKey++, id: null, description: "", amount: "", ledger_account: "" });

const InvoiceEdit = ({ config }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isCreateMode = !id;
  const createMutation = useCreateSalesInvoice();
  const updateMutation = useUpdateSalesInvoice();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [ledgerAccounts, setLedgerAccounts] = useState([]);
  const [lines, setLines] = useState([newEmptyLine()]);
  const [deletedLineIds, setDeletedLineIds] = useState([]);
  const [formData, setFormData] = useState({
    invoice_number: "",
    invoice_date: "",
    due_date: "",
    status: "DRAFT",
    description: "",
    relation: "",
  });

  const { autoNumberOnCreate, showRelation } = config;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const ledgerData = await getAllLedgerAccounts({ sort: "account_number", requestKey: null });
        setLedgerAccounts(ledgerData);

        if (isCreateMode) {
          const today = new Date();
          const todayStr = today.toISOString().slice(0, 10);
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
          const nextMonthStr = nextMonth.toISOString().slice(0, 10);
          const updates = { invoice_date: todayStr, due_date: nextMonthStr };
          if (autoNumberOnCreate) {
            updates.invoice_number = await getNextInvoiceNumber();
          }
          setFormData((prev) => ({ ...prev, ...updates }));
        } else {
          const [data, existingLines] = await Promise.all([
            getSalesInvoice(id, { requestKey: null }),
            getInvoiceLines({ filter: `invoice = "${id}"`, sort: "created", requestKey: null }),
          ]);
          setFormData({
            invoice_number: data.invoice_number || "",
            invoice_date: data.invoice_date?.slice(0, 10) || "",
            due_date: data.due_date?.slice(0, 10) || "",
            status: data.status || "DRAFT",
            description: data.description || "",
            relation: data.relation || "",
          });
          setLines(
            existingLines.length > 0
              ? existingLines.map((l) => ({
                  _key: nextKey++,
                  id: l.id,
                  description: l.description || "",
                  amount: l.amount !== null && l.amount !== undefined ? String(l.amount) : "",
                  ledger_account: l.ledger_account || "",
                }))
              : [newEmptyLine()],
          );
        }
      } catch (err) {
        if (!err?.isAbort) setError("Fout bij laden van gegevens.");
      }
      setLoading(false);
    };
    load();
  }, [id, isCreateMode, autoNumberOnCreate]);

  const handleLineChange = (key, field, value) => {
    setLines((prev) => prev.map((l) => (l._key === key ? { ...l, [field]: value } : l)));
  };

  const handleAddLine = () => {
    setLines((prev) => [...prev, newEmptyLine()]);
  };

  const handleRemoveLine = (key) => {
    setLines((prev) => {
      const line = prev.find((l) => l._key === key);
      if (line?.id) setDeletedLineIds((ids) => [...ids, line.id]);
      return prev.filter((l) => l._key !== key);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const invoicePayload = { ...formData, type: config.type };
      let invoiceId = id;
      if (isCreateMode) {
        const created = await createMutation.mutateAsync(invoicePayload);
        invoiceId = created.id;
        posthog.capture("invoice created", {
          invoice_id: invoiceId,
          invoice_type: config.type,
          invoice_number: formData.invoice_number,
          invoice_status: formData.status,
          line_count: lines.filter((l) => l.description.trim() !== "" || l.amount !== "").length,
        });
      } else {
        await updateMutation.mutateAsync({ id, data: invoicePayload });
        posthog.capture("invoice updated", {
          invoice_id: id,
          invoice_type: config.type,
          invoice_number: formData.invoice_number,
          invoice_status: formData.status,
        });
      }

      await Promise.all(deletedLineIds.map((lineId) => deleteInvoiceLine(lineId)));

      const linesToSave = lines.filter((l) => l.description.trim() !== "" || l.amount !== "");
      await Promise.all(
        linesToSave.map((line) => {
          const lineData = {
            invoice: invoiceId,
            description: line.description,
            amount: line.amount !== "" ? parseFloat(line.amount) : null,
            ledger_account: line.ledger_account || null,
          };
          return line.id ? updateInvoiceLine(line.id, lineData) : createInvoiceLine(lineData);
        }),
      );

      navigate(`${config.basePath}/${invoiceId}?${searchParams.toString()}`);
    } catch (err) {
      console.error(`Error saving ${config.type.toLowerCase()} invoice:`, err);
      posthog.captureException(err);
      alert(`Er is een fout opgetreden bij het opslaan.\n\n${err?.message ?? err}`);
    }
    setSaving(false);
  };

  if (loading) return <CenteredSpinner />;
  if (error) return <CenteredAlert text={error} />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title={isCreateMode ? config.newTitle : config.editTitle}
        variant="edit"
        backButton={
          <BackButton onClick={() => navigate(`${config.basePath}?${searchParams.toString()}`)} ariaLabel="Terug" />
        }
      >
        <CloseButton
          onClick={() => navigate(`${config.basePath}?${searchParams.toString()}`)}
          size="normal"
          ariaLabel="Annuleren"
        />
      </PageHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        <DetailCard title="Factuurgegevens">
          <DetailBlock>
            <Row>
              <Label htmlFor="invoice_number" required>
                Factuurnummer
              </Label>
              <Input
                id="invoice_number"
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder={config.invoiceNumberPlaceholder}
                required
              />
            </Row>
            {showRelation && (
              <Row>
                <Label htmlFor="relation">Relatie</Label>
                <FormFieldSelectAjax
                  name="relation"
                  collection="bs_relations"
                  searchFields={["organisation", "first_name", "last_name"]}
                  query={{ sort: "last_name,first_name" }}
                  optionDisplay={(r) =>
                    (r.organisation ? r.organisation + ": " : "") + [r.first_name, r.last_name].join(" ") ||
                    r.email ||
                    r.id
                  }
                  formData={formData}
                  setFormData={setFormData}
                  placeholder="Zoek een relatie..."
                  className="relative max-w-2xl"
                />
              </Row>
            )}

            <Row>
              <Label htmlFor="invoice_date" required>
                Factuurdatum
              </Label>
              <Input
                id="invoice_date"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                required
              />
            </Row>

            <Row>
              <Label htmlFor="due_date">Vervaldatum</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              />
            </Row>

            <Row>
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Row>

            <Row>
              <Label htmlFor="description">Omschrijving</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Omschrijving van de factuur"
              />
            </Row>
          </DetailBlock>
        </DetailCard>

        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="glass-header px-4 py-3">
            <h3 className="text-lg font-medium text-[var(--text-primary)]">Orderregels</h3>
          </div>
          <div className="flex gap-3 px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <div className="flex-1 pl-3">Omschrijving</div>
            <div className="w-36 pl-3">Bedrag (€)</div>
            <div className="w-100 pl-3">Grootboekrekening</div>
            <div className="w-20" />
          </div>
          {lines.map((line) => (
            <div key={line._key} className="flex items-center gap-3 px-4 py-2">
              <div className="flex-1 min-w-0">
                <Input
                  id={`desc-${line._key}`}
                  value={line.description}
                  onChange={(e) => handleLineChange(line._key, "description", e.target.value)}
                  placeholder="Omschrijving"
                  className="max-w-none"
                />
              </div>
              <div className="w-36 shrink-0">
                <Input
                  id={`amt-${line._key}`}
                  type="number"
                  step="0.01"
                  value={line.amount}
                  onChange={(e) => handleLineChange(line._key, "amount", e.target.value)}
                  placeholder="0.00"
                  className="max-w-none"
                />
              </div>
              <div className="w-100 shrink-0">
                <Select
                  id={`acct-${line._key}`}
                  value={line.ledger_account}
                  onChange={(e) => handleLineChange(line._key, "ledger_account", e.target.value)}
                >
                  <option value="">Selecteer (optioneel)</option>
                  {ledgerAccounts.map((la) => (
                    <option key={la.id} value={la.id}>
                      {la.account_number} – {la.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-20 shrink-0 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleRemoveLine(line._key)}
                  className="text-red-500 hover:text-red-700 text-sm whitespace-nowrap"
                >
                  Verwijderen
                </button>
              </div>
            </div>
          ))}
          <div className="px-4 py-3">
            <Button type="button" onClick={handleAddLine} color="gray" text="+ Orderregel toevoegen" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3 pt-4">
          <Button
            type="button"
            onClick={() => navigate(`${config.basePath}?${searchParams.toString()}`)}
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

export default InvoiceEdit;
