import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../../components/Button/BackButton";
import { DeleteButton } from "../../../components/Button/DeleteButton";
import { EditButton } from "../../../components/Button/EditButton";
import { destructiveIconButtonClasses, neutralIconButtonClasses } from "../../../components/Button/iconButtonClasses";
import { ArrowUturnLeftIcon, BookOpenIcon, DocumentArrowDownIcon } from "@heroicons/react/24/outline";
import CenteredAlert from "../../../components/CenteredAlert";
import CenteredSpinner from "../../../components/CenteredSpinner";
import DetailBlock, { Label, Row, Value } from "../../../components/Detail/DetailBlock";
import DetailCard from "../../../components/Detail/DetailCard";
import Input from "../../../components/Form/Input";
import SearchableSelect from "../../../components/Form/SearchableSelect";
import Textarea from "../../../components/Form/Textarea";
import DialogPanel from "../../../components/Modal/DialogPanel";
import PageContent from "../../../components/Page/PageContent";
import PageHeader from "../../../components/Page/PageHeader";
import { useDeleteSalesInvoice } from "../../../hooks/crudResourceHooks";
import { getInvoiceLines, updateInvoiceLine } from "../../../services/invoiceLineService";
import {
  createJournalEntry,
  createJournalTransaction,
  deleteJournalTransaction,
  getAllJournalTransactions,
  getNextEntryNumber,
} from "../../../services/journalTransactionService";
import { getAllLedgerAccounts } from "../../../services/ledgerAccountService";
import { getFiscalYearForDate } from "../../../services/fiscalYearService";
import { getSalesInvoice, updateSalesInvoice } from "../../../services/salesInvoiceService";
import { generateInvoicePdf } from "../../../utils/invoicePdfUtils";
import { STATUS_CLASSES, STATUS_LABELS, formatCurrency } from "./invoiceConstants";

const InvoiceDetail = ({ config }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deleteMutation = useDeleteSalesInvoice();

  const [invoice, setInvoice] = useState(null);
  const [lines, setLines] = useState([]);
  const [ledgerAccounts, setLedgerAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingLine, setEditingLine] = useState(null);
  const [lineForm, setLineForm] = useState({ amount: "", description: "", ledger_account: "" });
  const [savingLine, setSavingLine] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getSalesInvoice(id, { expand: "relation" }),
      getInvoiceLines({ filter: `invoice = "${id}"` }),
      getAllLedgerAccounts({ sort: "account_number" }),
    ])
      .then(([invoiceData, linesData, accountsData]) => {
        setInvoice(invoiceData);
        setLines(linesData);
        setLedgerAccounts(accountsData);
      })
      .catch((err) => {
        if (!err?.isAbort) setError(err?.message || "Factuur niet gevonden.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je deze factuur wilt verwijderen?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      navigate(`${config.basePath}?${searchParams.toString()}`);
    } catch (err) {
      console.error("Error deleting invoice:", err);
      alert("Er is een fout opgetreden bij het verwijderen van de factuur.");
    }
  };

  const openLineModal = (line) => {
    setEditingLine(line);
    setLineForm({
      amount: line.amount !== undefined && line.amount !== null ? String(line.amount) : "",
      description: line.description || "",
      ledger_account: line.ledger_account || "",
    });
  };

  const handleLineSave = async (e) => {
    e.preventDefault();
    setSavingLine(true);
    try {
      const updated = await updateInvoiceLine(editingLine.id, {
        amount: lineForm.amount !== "" ? parseFloat(lineForm.amount) : null,
        description: lineForm.description,
        ledger_account: lineForm.ledger_account || null,
      });
      setLines((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setEditingLine(null);
    } catch (err) {
      console.error("Error saving line:", err);
      alert("Er is een fout opgetreden bij het opslaan.");
    }
    setSavingLine(false);
  };

  const handleBookInvoice = async () => {
    const bookableLines = lines.filter((l) => l.ledger_account && l.amount);
    if (bookableLines.length === 0) {
      alert("Geen factuurregels met bedrag en grootboekrekening om te boeken.");
      return;
    }
    const { counterpartAccountNumber, counterpartAccountName, transactionType, counterpartIsDebit } = config.booking;
    const counterpartAccount = ledgerAccounts.find((la) => la.account_number === counterpartAccountNumber);
    if (!counterpartAccount) {
      alert(`Grootboekrekening ${counterpartAccountNumber} (${counterpartAccountName}) niet gevonden.`);
      return;
    }
    setBooking(true);
    try {
      const dateStr = invoice.invoice_date?.slice(0, 10);
      const [fiscalYear, entryNumber] = await Promise.all([getFiscalYearForDate(dateStr), getNextEntryNumber()]);
      const total = bookableLines.reduce((sum, l) => sum + l.amount, 0);
      const transaction = await createJournalTransaction({
        transaction_date: dateStr,
        entry_number: entryNumber,
        description: invoice.invoice_number + (invoice.description ? ` – ${invoice.description}` : ""),
        source_type: "fi_invoices",
        source_id: id,
        transaction_type: transactionType,
        fiscal_year: fiscalYear?.id ?? null,
      });

      if (counterpartIsDebit) {
        // SALES: debit counterpart (receivables), credit per line
        await createJournalEntry({
          journal_transaction: transaction.id,
          ledger_account: counterpartAccount.id,
          debit: total,
          credit: 0,
        });
        for (const line of bookableLines) {
          await createJournalEntry({
            journal_transaction: transaction.id,
            ledger_account: line.ledger_account,
            debit: 0,
            credit: line.amount,
          });
        }
      } else {
        // PURCHASE: debit per line, credit counterpart (payables)
        for (const line of bookableLines) {
          await createJournalEntry({
            journal_transaction: transaction.id,
            ledger_account: line.ledger_account,
            debit: line.amount,
            credit: 0,
          });
        }
        await createJournalEntry({
          journal_transaction: transaction.id,
          ledger_account: counterpartAccount.id,
          debit: 0,
          credit: total,
        });
      }

      const updated = await updateSalesInvoice(id, { status: "BOOKED" });
      setInvoice(updated);
    } catch (err) {
      console.error("Error booking invoice:", err);
      alert("Fout bij boeken van factuur.");
    }
    setBooking(false);
  };

  const handleRevertToConcept = async () => {
    if (
      !window.confirm(
        "Weet je zeker dat je deze factuur terug naar concept wilt zetten? De bijbehorende journaalboekingen worden verwijderd.",
      )
    )
      return;
    setBooking(true);
    try {
      const transactions = await getAllJournalTransactions({
        filter: `source_type = "fi_invoices" && source_id = "${id}"`,
      });
      await Promise.all(transactions.map((t) => deleteJournalTransaction(t.id)));
      const updated = await updateSalesInvoice(id, { status: "DRAFT" });
      setInvoice(updated);
    } catch (err) {
      console.error("Error reverting invoice:", err);
      alert("Fout bij terugzetten naar concept.");
    }
    setBooking(false);
  };

  if (loading) return <CenteredSpinner />;
  if (error) return <CenteredAlert text={error} />;
  if (!invoice) return <CenteredAlert text="Factuur niet gevonden." />;

  const rel = config.showRelation ? invoice.expand?.relation : null;
  const userName = rel ? [rel.first_name, rel.last_name].filter(Boolean).join(" ") || rel.email : null;

  const ledgerOptions = ledgerAccounts.map((a) => ({
    value: a.id,
    label: `${a.account_number} – ${a.name}`,
  }));

  return (
    <PageContent fullWidth>
      <PageHeader
        title={invoice.invoice_number || "Factuur"}
        backButton={
          <BackButton
            onClick={() => navigate(`${config.basePath}?${searchParams.toString()}`)}
            ariaLabel={config.backAriaLabel}
          />
        }
      >
        {invoice.status === "DRAFT" && (
          <button
            type="button"
            onClick={handleBookInvoice}
            disabled={booking}
            className={neutralIconButtonClasses(true)}
          >
            <BookOpenIcon className="w-5 h-5 mr-1" />
            {booking ? "Boeken..." : "Boek factuur"}
          </button>
        )}
        {invoice.status !== "DRAFT" && (
          <button
            type="button"
            onClick={handleRevertToConcept}
            disabled={booking}
            className={destructiveIconButtonClasses(true)}
          >
            <ArrowUturnLeftIcon className="w-5 h-5 mr-1" />
            {booking ? "Bezig..." : "Terug naar concept"}
          </button>
        )}
        {config.type === "SALES" && (
          <button
            type="button"
            onClick={() => generateInvoicePdf(invoice, lines, ledgerAccounts)}
            className={neutralIconButtonClasses(true)}
            title="Download factuur als PDF"
          >
            <DocumentArrowDownIcon className="w-5 h-5 mr-1" />
            {"Download"}
          </button>
        )}
        <EditButton
          onClick={() => navigate(`${config.basePath}/${id}/edit?${searchParams.toString()}`)}
          showText
          size="normal"
          ariaLabel="Factuur bewerken"
        />
        <DeleteButton onClick={handleDelete} showText size="normal" ariaLabel="Factuur verwijderen" />
      </PageHeader>

      <div className="space-y-6">
        <DetailCard title="Factuurgegevens">
          <DetailBlock>
            <Row>
              <Label>Factuurnummer</Label>
              <Value>{invoice.invoice_number || "-"}</Value>
            </Row>
            <Row>
              <Label>Status</Label>
              <Value>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${STATUS_CLASSES[invoice.status] ?? "bg-gray-100 text-gray-700"}`}
                >
                  {STATUS_LABELS[invoice.status] ?? invoice.status ?? "-"}
                </span>
              </Value>
            </Row>
            {config.showRelation && (
              <Row>
                <Label>Relatie</Label>
                <Value>{userName || "-"}</Value>
              </Row>
            )}
            <Row>
              <Label>Factuurdatum</Label>
              <Value>{invoice.invoice_date?.slice(0, 10) || "-"}</Value>
            </Row>
            <Row>
              <Label>Vervaldatum</Label>
              <Value>{invoice.due_date?.slice(0, 10) || "-"}</Value>
            </Row>
            {invoice.description && (
              <Row>
                <Label>Omschrijving</Label>
                <Value>{invoice.description}</Value>
              </Row>
            )}
          </DetailBlock>
        </DetailCard>

        <DetailCard title="Factuurregels">
          {lines.length === 0 ? (
            <span className="text-[var(--text-secondary)]">Geen factuurregels.</span>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-[var(--text-secondary)]">
                    <th className="pb-2 pr-4 font-medium">Omschrijving</th>
                    <th className="pb-2 pr-4 font-medium">Grootboekrekening</th>
                    <th className="pb-2 text-right font-medium">Bedrag</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lines.map((line) => {
                    const account = ledgerAccounts.find((a) => a.id === line.ledger_account);
                    return (
                      <tr
                        key={line.id}
                        onClick={() => openLineModal(line)}
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="py-2 pr-4">{line.description || "-"}</td>
                        <td className="py-2 pr-4 text-[var(--text-secondary)]">
                          {account ? `${account.account_number} – ${account.name}` : "-"}
                        </td>
                        <td className="py-2 text-right">{formatCurrency(line.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t font-medium">
                    <td className="pt-2 pr-4" colSpan={2}>
                      Totaal
                    </td>
                    <td className="pt-2 text-right">
                      {formatCurrency(lines.reduce((sum, l) => sum + (l.amount ?? 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </DetailCard>
      </div>

      <DialogPanel open={editingLine !== null} title="Factuurregel bewerken" onClose={() => setEditingLine(null)}>
        <form onSubmit={handleLineSave} className="space-y-4">
          <div>
            <label
              htmlFor="line-description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Omschrijving
            </label>
            <Textarea
              id="line-description"
              value={lineForm.description}
              onChange={(e) => setLineForm({ ...lineForm, description: e.target.value })}
              rows={3}
              placeholder="Omschrijving van de factuurregel"
            />
          </div>
          <div>
            <label htmlFor="line-amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bedrag (€)
            </label>
            <Input
              id="line-amount"
              type="number"
              step="0.01"
              value={lineForm.amount}
              onChange={(e) => setLineForm({ ...lineForm, amount: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grootboekrekening</label>
            <SearchableSelect
              options={ledgerOptions}
              value={lineForm.ledger_account}
              onChange={(val) => setLineForm({ ...lineForm, ledger_account: val })}
              placeholder="Selecteer grootboekrekening"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditingLine(null)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={savingLine}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {savingLine ? "Opslaan..." : "Opslaan"}
            </button>
          </div>
        </form>
      </DialogPanel>
    </PageContent>
  );
};

export default InvoiceDetail;
