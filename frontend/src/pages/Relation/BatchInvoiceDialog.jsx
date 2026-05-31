import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Button } from "../../components/Button/Button";
import Input from "../../components/Form/Input";
import Select from "../../components/Form/Select";
import Textarea from "../../components/Form/Textarea";
import DialogPanel from "../../components/Modal/DialogPanel";
import { useAllLedgerAccounts } from "../../hooks/crudResourceHooks";
import pb from "../../pb";
import { createBatchRun, updateBatchRun } from "../../services/batchRunService";
import { getFiscalYearForDate } from "../../services/fiscalYearService";
import {
  createJournalEntry,
  createJournalTransaction,
  getNextEntryNumber,
} from "../../services/journalTransactionService";
import { getNextInvoiceNumber } from "../../services/salesInvoiceService";
import { generateSepaSdd } from "../../utils/sepaGenerator";

const BatchInvoiceDialog = ({ open, onClose, selectedIds, onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    invoice_date: dayjs().format("YYYY-MM-DD"),
    due_date: dayjs().add(14, "day").format("YYYY-MM-DD"),
    description: "",
    invoice_number_start: "",
    ledger_account: "",
  });
  const { data: ledgerAccounts = [] } = useAllLedgerAccounts();
  const [createSepa, setCreateSepa] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [sepaDownloadUrl, setSepaDownloadUrl] = useState(null);

  useEffect(() => {
    if (!open) return;
    getNextInvoiceNumber().then((next) => {
      setFormData((prev) => ({ ...prev, invoice_number_start: next }));
    });
    setSepaDownloadUrl(null);
  }, [open]);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Voer een geldig bedrag in.");
      }

      const parts = formData.invoice_number_start.split("-");
      const seqPart = parts.pop();
      const prefix = parts.join("-") + "-";
      const startNum = parseInt(seqPart, 10);
      if (isNaN(startNum)) {
        throw new Error("Voer een geldig factuurnummer in (bijv. 2026-001).");
      }

      // Step 1: Create batch run if requested
      let batchRunId = null;
      if (createSepa) {
        const batchRun = await createBatchRun({
          run_date: formData.invoice_date,
          description: formData.description || "SEPA Batch",
          type: "SEPA",
          status: "PROCESSING",
          amount: amount * selectedIds.length,
          ledger_account: formData.ledger_account || null,
        });
        batchRunId = batchRun.id;
      }

      // Step 2: Create invoices
      const invoicesToCreate = selectedIds.map((id, index) => {
        const paddedNum = String(startNum + index).padStart(seqPart.length, "0");
        const invoiceNumber = `${prefix}${paddedNum}`;

        return {
          header: {
            invoice_number: invoiceNumber,
            invoice_date: formData.invoice_date,
            due_date: formData.due_date,
            description: formData.description,
            status: "concept",
            relation: id,
            type: "SALES",
            ...(batchRunId ? { batch_run: batchRunId } : {}),
          },
          line: {
            amount: amount,
            description: formData.description,
            ...(!createSepa && formData.ledger_account ? { ledger_account: formData.ledger_account } : {}),
          },
        };
      });

      const resultsList = [];
      for (const invoiceData of invoicesToCreate) {
        try {
          const created = await pb.collection("fi_invoices").create(invoiceData.header);
          await pb.collection("fi_invoice_lines").create({
            ...invoiceData.line,
            invoice: created.id,
          });
          resultsList.push({ success: true, id: created.id });
        } catch (err) {
          console.error("Error creating invoice:", err);
          resultsList.push({ success: false, error: err.message, relationId: invoiceData.header.relation });
        }
      }

      const successful = resultsList.filter((r) => r.success).length;
      const failed = resultsList.filter((r) => !r.success).length;

      // Step 3: Generate and attach SEPA file
      let sepaError = null;
      if (createSepa && batchRunId) {
        try {
          const paramRecords = await pb.collection("parameters").getFullList({
            filter: 'name ~ "sepa_"',
          });
          const params = {};
          paramRecords.forEach((r) => {
            params[r.name] = r.value;
          });

          if (!params.sepa_creditor_id || !params.sepa_iban || !params.sepa_organisation_name) {
            throw new Error("SEPA instellingen (Creditor ID, IBAN, Organisatienaam) ontbreken in parameters.");
          }

          const filter = selectedIds.map((id) => `id="${id}"`).join(" || ");
          const members = await pb.collection("bs_relations").getFullList({ filter });

          const creditor = {
            name: params.sepa_organisation_name,
            iban: params.sepa_iban,
            id: params.sepa_creditor_id,
            bic: params.sepa_bic || "",
          };

          const payment = {
            id: `SDD-${dayjs().format("YYYYMMDD-HHmmss")}`,
            date: formData.invoice_date,
            description: formData.description || "SEPA Batch",
          };

          const debtors = members
            .filter((m) => m.iban && m.mandate_reference)
            .map((m) => ({
              name: m.account_holder_name || `${m.first_name} ${m.last_name}`,
              iban: m.iban,
              mandateId: m.mandate_reference,
              amount,
            }));

          if (debtors.length === 0) {
            throw new Error("Geen relaties hebben een geldig IBAN en mandaatkenmerk.");
          }

          const xml = generateSepaSdd(creditor, payment, debtors);
          const blob = new Blob([xml], { type: "application/xml" });
          const url = URL.createObjectURL(blob);
          setSepaDownloadUrl(url);

          const file = new File([blob], `SEPA-SDD-${formData.invoice_date}.xml`, { type: "application/xml" });
          const fd = new FormData();
          fd.append("sepa_file", file);
          fd.append("status", "COMPLETED");
          await updateBatchRun(batchRunId, fd);
        } catch (err) {
          console.error("Error generating SEPA file:", err);
          sepaError = err.message;
          await updateBatchRun(batchRunId, { status: "FAILED" });
        }
      }

      // Step 4: Create journal transaction for SEPA batch
      let journalError = null;
      if (createSepa && formData.ledger_account && successful > 0) {
        try {
          const account1100 = ledgerAccounts.find((la) => la.is_suspense_account === true);
          if (!account1100) throw new Error("Geen tussenrekening (is_suspense_account) gevonden.");

          const total = amount * successful;
          const [fiscalYear, entryNumber] = await Promise.all([
            getFiscalYearForDate(formData.invoice_date),
            getNextEntryNumber(),
          ]);

          const transaction = await createJournalTransaction({
            transaction_date: formData.invoice_date,
            entry_number: entryNumber,
            description: formData.description || "SEPA Batch",
            source_type: "fi_batch_runs",
            source_id: batchRunId,
            transaction_type: "SEPA_BATCH",
            fiscal_year: fiscalYear?.id ?? null,
          });

          await createJournalEntry({
            journal_transaction: transaction.id,
            ledger_account: account1100.id,
            debit: total,
            credit: 0,
          });
          await createJournalEntry({
            journal_transaction: transaction.id,
            ledger_account: formData.ledger_account,
            debit: 0,
            credit: total,
          });
        } catch (err) {
          console.error("Error creating journal transaction:", err);
          journalError = err.message;
        }
      }

      setResults({ successful, failed, total: selectedIds.length, sepaError, journalError });

      if (onComplete && successful > 0) {
        onComplete();
      }
    } catch (err) {
      console.error("Batch invoice error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogPanel open={open} onClose={onClose} title="Batch Facturen Aanmaken">
      <div className="space-y-4">
        {results ? (
          <div className="py-6 text-center space-y-4">
            <div
              className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${results.failed === 0 && !results.sepaError && !results.journalError ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}
            >
              {results.failed === 0 && !results.sepaError && !results.journalError ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-10 h-10"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-10 h-10"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {results.failed === 0 && !results.sepaError && !results.journalError
                  ? "Klaar!"
                  : "Batch voltooid met fouten"}
              </h3>
              <p className="text-gray-500 mt-1">
                {results.successful} facturen succesvol aangemaakt.
                {results.failed > 0 && ` ${results.failed} facturen mislukt.`}
              </p>
              {results.sepaError && (
                <p className="text-red-600 text-sm mt-2">SEPA bestand mislukt: {results.sepaError}</p>
              )}
              {results.journalError && (
                <p className="text-red-600 text-sm mt-2">Journaalpost mislukt: {results.journalError}</p>
              )}
            </div>
            {sepaDownloadUrl && (
              <a href={sepaDownloadUrl} download={`SEPA-SDD-${formData.invoice_date}.xml`} className="block">
                <Button color="green" text="Download SEPA Bestand" className="w-full justify-center" />
              </a>
            )}
            <Button color="blue" onClick={onClose} text="Sluiten" className="w-full justify-center" />
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Er worden facturen aangemaakt voor de {selectedIds.length} geselecteerde relaties.
            </p>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="sm:col-span-2">
                <Input
                  label="Bedrag per relatie (€)"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  placeholder="0,00"
                />
              </div>
              <Input
                label="Factuurdatum"
                type="date"
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                required
              />
              <Input
                label="Vervaldatum"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
              <Input
                label="Eerste factuurnummer"
                value={formData.invoice_number_start}
                onChange={(e) => setFormData({ ...formData, invoice_number_start: e.target.value })}
                placeholder="Bijv. 2026-001"
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Omschrijving"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="Bijv. Jaarlijkse contributie"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Grootboekrekening
                </label>
                <Select
                  value={formData.ledger_account}
                  onChange={(e) => setFormData({ ...formData, ledger_account: e.target.value })}
                >
                  <option value="">— Geen —</option>
                  {ledgerAccounts.map((la) => (
                    <option key={la.id} value={la.id}>
                      {la.account_number} – {la.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  id="createSepa"
                  type="checkbox"
                  checked={createSepa}
                  onChange={(e) => setCreateSepa(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="createSepa" className="text-sm text-gray-700 dark:text-gray-300">
                  SEPA Batch aanmaken
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
              <Button color="gray" onClick={onClose} text="Annuleren" variant="ghost" />
              <Button
                color="blue"
                onClick={handleCreate}
                loading={loading}
                disabled={loading || !formData.amount}
                text="Facturen aanmaken"
              />
            </div>
          </>
        )}
      </div>
    </DialogPanel>
  );
};

export default BatchInvoiceDialog;
