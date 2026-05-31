import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import posthog from "../../../posthog";
import { Button } from "../../../components/Button/Button";
import Label from "../../../components/Form/Label";
import SearchableSelect from "../../../components/Form/SearchableSelect";
import DialogPanel from "../../../components/Modal/DialogPanel";
import { processLine } from "../../../services/bankStatementService";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);

const ProcessLineDialog = ({ line, ledgerAccounts, invoices, batchRuns, onClose }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [sel, setSel] = useState({ counterAccountId: "", invoiceId: "", batchRunId: "" });
  const [showAllAccounts, setShowAllAccounts] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Reset state whenever a different line is opened
  useEffect(() => {
    if (line) {
      setSel({ counterAccountId: "", invoiceId: "", batchRunId: "" });
      setShowAllAccounts(false);
      setError(null);
      setResult(null);
    }
  }, [line?.id]);

  function setField(field, value) {
    setSel((prev) => ({ ...prev, [field]: value }));
  }

  function getCounterAccountOptions() {
    const all = ledgerAccounts.map((acc) => ({
      value: acc.id,
      label: `${acc.account_number} ${acc.name}`,
    }));
    if (showAllAccounts || !line) return all;
    if (line.amount > 0)
      return ledgerAccounts
        .filter((acc) => acc.category === "REVENUE")
        .map((acc) => ({ value: acc.id, label: `${acc.account_number} ${acc.name}` }));
    if (line.amount < 0)
      return ledgerAccounts
        .filter((acc) => acc.category === "EXPENSES" || acc.category === "ASSETS")
        .map((acc) => ({ value: acc.id, label: `${acc.account_number} ${acc.name}` }));
    return all;
  }

  const invoiceOptions = invoices.map((inv) => ({
    value: inv.id,
    label: `${inv.invoice_number}${inv.description ? ` – ${inv.description}` : ""}`,
  }));

  const batchRunOptions = batchRuns.map((br) => ({
    value: br.id,
    label: `${br.run_date?.slice(0, 10) || ""} – ${br.description || br.id}`,
  }));

  async function handleProcess() {
    if (!sel.counterAccountId && !sel.invoiceId && !sel.batchRunId) {
      setError("Selecteer een tegenrekening, factuur of batchrun.");
      return;
    }
    setError(null);
    setProcessing(true);
    try {
      const tx = await processLine(line, {
        counterAccountId: sel.counterAccountId,
        invoiceId: sel.invoiceId || "",
        batchRunId: sel.batchRunId || "",
      });
      posthog.capture("bank statement line processed", {
        line_id: line.id,
        line_amount: line.amount,
        matched_to: sel.invoiceId ? "invoice" : sel.batchRunId ? "batch_run" : "ledger_account",
        transaction_id: tx?.id,
      });
      queryClient.invalidateQueries({ queryKey: ["bankStatementLines"] });
      setResult(tx);
    } catch (e) {
      posthog.captureException(e);
      setError(e.message);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <DialogPanel open={!!line} onClose={onClose} title="Verwerk bankafschriftregel">
      {/* Line summary */}
      {line && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm space-y-1">
          <div className="flex gap-4">
            <span className="text-gray-500 dark:text-gray-400 w-24 shrink-0">Datum</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {line.date?.slice(0, 10) || "-"}
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-gray-500 dark:text-gray-400 w-24 shrink-0">Bedrag</span>
            <span
              className={`font-mono font-medium ${
                line.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"
              }`}
            >
              {formatCurrency(line.amount)}
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-gray-500 dark:text-gray-400 w-24 shrink-0">Omschrijving</span>
            <span className="text-gray-900 dark:text-gray-100">{line.description || "-"}</span>
          </div>
        </div>
      )}

      {result ? (
        /* Success state */
        <div className="space-y-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
            <p className="text-green-700 dark:text-green-300 text-sm font-medium">
              Bankafschriftregel verwerkt!
            </p>
          </div>
          {result.id && (
            <button
              onClick={() => {
                navigate(`/finance/journal-transactions/${result.id}`);
                onClose();
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              → Bekijk journaalpost {result.entry_number}
            </button>
          )}
          <div className="flex justify-end pt-2">
            <Button onClick={onClose} color="gray" text="Sluiten" />
          </div>
        </div>
      ) : (
        /* Form */
        <div className="space-y-4">
          {/* Counter account — hidden when invoice or batch run is selected */}
          {!sel.invoiceId && !sel.batchRunId && (
            <div>
              <Label>Tegenrekening</Label>
              <SearchableSelect
                options={getCounterAccountOptions()}
                value={sel.counterAccountId}
                onChange={(v) => setField("counterAccountId", v)}
                placeholder="— Selecteer tegenrekening —"
                disabled={processing}
                footerAction={
                  line?.amount !== 0
                    ? {
                        label: showAllAccounts ? "Filter op bedrag" : "Toon alles",
                        onClick: () => setShowAllAccounts((v) => !v),
                      }
                    : null
                }
              />
            </div>
          )}

          {/* Invoice — hidden when batch run is selected */}
          {!sel.batchRunId && (
            <div>
              <Label>Factuur</Label>
              <SearchableSelect
                options={invoiceOptions}
                value={sel.invoiceId}
                onChange={(v) => setField("invoiceId", v)}
                placeholder="— Selecteer factuur —"
                disabled={processing}
              />
            </div>
          )}

          {/* Batch run */}
          <div>
            <Label>Batchrun</Label>
            <SearchableSelect
              options={batchRunOptions}
              value={sel.batchRunId}
              onChange={(v) => setField("batchRunId", v)}
              placeholder="— Selecteer batchrun —"
              disabled={processing}
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-2 pt-2 justify-end">
            <Button onClick={onClose} color="gray" text="Annuleren" disabled={processing} />
            <Button
              onClick={handleProcess}
              color="blue"
              text={processing ? "Verwerken..." : "Verwerk"}
              disabled={processing || (!sel.counterAccountId && !sel.invoiceId && !sel.batchRunId)}
            />
          </div>
        </div>
      )}
    </DialogPanel>
  );
};

export default ProcessLineDialog;
