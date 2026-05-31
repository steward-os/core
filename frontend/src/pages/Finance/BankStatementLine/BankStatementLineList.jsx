import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../../components/Button";
import { Button } from "../../../components/Button/Button";
import { DeleteButton } from "../../../components/Button/DeleteButton";
import { EditButton } from "../../../components/Button/EditButton";
import CenteredAlert from "../../../components/CenteredAlert";
import CenteredSpinner from "../../../components/CenteredSpinner";
import { ListContainer, ListHeading } from "../../../components/List";
import {
  useAllBatchRuns,
  useAllInvoices,
  useAllLedgerAccounts,
  useBankStatementLines,
  useDeleteBankStatementLine,
  useDeleteBankStatementLineWithConfirm,
} from "../../../hooks/crudResourceHooks";
import { useSelection } from "../../../hooks/useSelection";
import ProcessLineDialog from "./ProcessLineDialog";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);

const BankStatementLineList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const handleDelete = useDeleteBankStatementLineWithConfirm();

  const { data, isLoading, error } = useBankStatementLines(1, 100, {
    sort: "-date",
    expand: "journal_transaction",
  });
  const { data: ledgerAccounts = [] } = useAllLedgerAccounts();
  const { data: invoices = [] } = useAllInvoices();
  const { data: batchRuns = [] } = useAllBatchRuns();

  const [dialogLine, setDialogLine] = useState(null);

  const lines = data?.items || [];
  const { mutateAsync: deleteLine } = useDeleteBankStatementLine();
  const selection = useSelection(lines);

  async function handleBulkDelete() {
    const count = selection.selectedCount;
    if (!window.confirm(`Weet je zeker dat je ${count} bankafschriftregel(s) wilt verwijderen?`)) return;
    try {
      await Promise.all(Array.from(selection.selectedIds).map((id) => deleteLine(id)));
      selection.clearSelection();
    } catch (e) {
      console.error("Fout bij verwijderen:", e);
    }
  }

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          <>
            <Button
              onClick={() => navigate("/finance/bank-statement-lines/import")}
              color="gray"
              text="MT940 importeren"
            />
            <AddButton
              onClick={() => navigate(`/finance/bank-statement-lines/new?${searchParams.toString()}`)}
              ariaLabel="Nieuwe bankafschriftregel"
            />
          </>
        }
      >
        Bankafschriften
      </ListHeading>

      {isLoading && <CenteredSpinner />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}

      {/* Bulk action bar */}
      {selection.selectedCount > 0 && (
        <div className="mb-2 bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            {selection.selectedCount} regel(s) geselecteerd
          </span>
          <Button
            onClick={handleBulkDelete}
            color="red"
            text={`Verwijder geselecteerde (${selection.selectedCount})`}
          />
        </div>
      )}

      {!isLoading && !error && (
        <div className="border border-[var(--glass-border)] rounded-lg overflow-hidden">
          {/* Table header — desktop only */}
          <div className="hidden md:flex items-center bg-gray-50 dark:bg-gray-800 border-b border-[var(--glass-border)] px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
            <div className="w-10 shrink-0">
              <input
                type="checkbox"
                checked={selection.isAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = selection.isIndeterminate;
                }}
                onChange={selection.toggleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
            <div className="w-24 shrink-0">Datum</div>
            <div className="w-28 shrink-0 text-right pr-4">Bedrag</div>
            <div className="flex-[2] min-w-0 px-4">Omschrijving</div>
            <div className="flex-1 px-2">Status</div>
            <div className="w-36 shrink-0 text-right">Actie</div>
          </div>

          {/* Rows */}
          <div className="bg-white dark:bg-gray-900 divide-y divide-[var(--glass-border)]">
            {lines.length === 0 && (
              <div className="text-center text-[var(--text-secondary)] py-8 text-sm">
                Geen bankafschriftregels gevonden.
              </div>
            )}
            {lines.map((line) => {
              const isProcessed = line.status === "PROCESSED";

              return (
                <div
                  key={line.id}
                  className={`flex flex-col md:flex-row md:items-center px-4 py-2 gap-2 md:gap-0 ${selection.isSelected(line.id) ? "bg-blue-50 dark:bg-blue-900/20" : ""}`}
                >
                  {/* Checkbox */}
                  <div className="hidden md:flex w-10 shrink-0">
                    <input
                      type="checkbox"
                      checked={selection.isSelected(line.id)}
                      onChange={() => selection.toggleItem(line.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  {/* Date */}
                  <div className="w-24 shrink-0 text-sm text-[var(--text-primary)] font-medium">
                    {line.date?.slice(0, 10) || "-"}
                  </div>

                  {/* Amount */}
                  <div
                    className={`w-28 shrink-0 text-sm text-right pr-4 font-mono font-medium ${
                      line.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"
                    }`}
                  >
                    {line.amount != null ? formatCurrency(line.amount) : "-"}
                  </div>

                  {/* Description */}
                  <div
                    className="flex-[2] min-w-0 px-4 text-sm text-[var(--text-secondary)] truncate"
                    title={line.description}
                  >
                    {line.description || "-"}
                  </div>

                  {/* Status */}
                  <div className="flex-1 min-w-0 px-2 flex items-center gap-2">
                    {isProcessed ? (
                      <>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 shrink-0">
                          Verwerkt
                        </span>
                        {line.journal_transaction && (
                          <button
                            onClick={() => navigate(`/finance/journal-transactions/${line.journal_transaction}`)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate"
                          >
                            {line.expand?.journal_transaction?.entry_number || "→"}
                          </button>
                        )}
                      </>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                        Niet verwerkt
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="w-36 shrink-0 flex justify-end items-center gap-1">
                    {!isProcessed && (
                      <Button
                        onClick={() => setDialogLine(line)}
                        color="blue"
                        text="Verwerk"
                        className="!px-2 !py-1 !text-xs"
                      />
                    )}
                    <EditButton
                      onClick={() =>
                        navigate(`/finance/bank-statement-lines/${line.id}/edit?${searchParams.toString()}`)
                      }
                      ariaLabel="Bewerken"
                    />
                    <DeleteButton onClick={() => handleDelete(line)} ariaLabel="Verwijderen" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ProcessLineDialog
        line={dialogLine}
        ledgerAccounts={ledgerAccounts}
        invoices={invoices}
        batchRuns={batchRuns}
        onClose={() => setDialogLine(null)}
      />
    </ListContainer>
  );
};

export default BankStatementLineList;
