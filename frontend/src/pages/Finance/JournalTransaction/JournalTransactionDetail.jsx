import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BackButton } from "../../../components/Button/BackButton";
import { Button } from "../../../components/Button/Button";
import { DeleteButton } from "../../../components/Button/DeleteButton";
import { EditButton } from "../../../components/Button/EditButton";
import CenteredAlert from "../../../components/CenteredAlert";
import CenteredSpinner from "../../../components/CenteredSpinner";
import DetailBlock, { Label, Row, Value } from "../../../components/Detail/DetailBlock";
import DetailCard from "../../../components/Detail/DetailCard";
import Input from "../../../components/Form/Input";
import Select from "../../../components/Form/Select";
import PageContent from "../../../components/Page/PageContent";
import PageHeader from "../../../components/Page/PageHeader";
import { useDeleteJournalTransaction } from "../../../hooks/crudResourceHooks";
import {
  createJournalEntry,
  deleteJournalEntry,
  getJournalEntries,
  getJournalTransaction,
} from "../../../services/journalTransactionService";
import { getAllLedgerAccounts } from "../../../services/ledgerAccountService";
import { TRANSACTION_TYPE_LABELS } from "../../../utils/financeConstants";

const formatCurrency = (val) =>
  val !== undefined && val !== null && val !== 0
    ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(val)
    : "-";

const JournalTransactionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deleteTransactionMutation = useDeleteJournalTransaction();

  const [transaction, setTransaction] = useState(null);
  const [entries, setEntries] = useState([]);
  const [ledgerAccounts, setLedgerAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [savingEntry, setSavingEntry] = useState(false);
  const [newEntry, setNewEntry] = useState({ ledger_account: "", debit: "", credit: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [txData, entriesData, accountsData] = await Promise.all([
        getJournalTransaction(id, { expand: "fiscal_year" }),
        getJournalEntries(id),
        getAllLedgerAccounts({ sort: "account_number" }),
      ]);
      setTransaction(txData);
      setEntries(entriesData);
      setLedgerAccounts(accountsData);
    } catch (err) {
      if (err?.isAbort) return;
      console.error("Error fetching transaction:", err);
      setLoadError(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je deze boeking wilt verwijderen?")) return;
    try {
      await deleteTransactionMutation.mutateAsync(id);
      navigate(`/finance/journal-transactions?${searchParams.toString()}`);
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert("Er is een fout opgetreden bij het verwijderen.");
    }
  };

  const handleAddEntry = async (e) => {
    e.preventDefault();
    if (!newEntry.ledger_account) {
      alert("Selecteer een grootboekrekening.");
      return;
    }
    setSavingEntry(true);
    try {
      await createJournalEntry({
        journal_transaction: id,
        ledger_account: newEntry.ledger_account,
        debit: newEntry.debit !== "" ? parseFloat(newEntry.debit) : 0,
        credit: newEntry.credit !== "" ? parseFloat(newEntry.credit) : 0,
      });
      setNewEntry({ ledger_account: "", debit: "", credit: "" });
      await fetchData();
    } catch (err) {
      console.error("Error creating entry:", err);
      alert("Fout bij toevoegen van boekingsregel.");
    }
    setSavingEntry(false);
  };

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm("Boekingsregel verwijderen?")) return;
    try {
      await deleteJournalEntry(entryId);
      await fetchData();
    } catch (err) {
      console.error("Error deleting entry:", err);
      alert("Fout bij verwijderen van boekingsregel.");
    }
  };

  const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.005;

  if (loading) return <CenteredSpinner />;
  if (loadError)
    return (
      <PageContent fullWidth>
        <div className="m-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm">
          <p className="font-semibold text-red-700 dark:text-red-400 mb-2">Fout bij laden van boeking</p>
          <p className="text-red-600 dark:text-red-300 mb-1">{loadError.message}</p>
          {loadError.status && <p className="text-red-500 dark:text-red-400">HTTP status: {loadError.status}</p>}
          {loadError.response?.message && loadError.response.message !== loadError.message && (
            <p className="text-red-500 dark:text-red-400">Server: {loadError.response.message}</p>
          )}
          {loadError.response?.data && Object.keys(loadError.response.data).length > 0 && (
            <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded text-xs text-red-700 dark:text-red-300 overflow-auto">
              {JSON.stringify(loadError.response.data, null, 2)}
            </pre>
          )}
        </div>
      </PageContent>
    );
  if (!transaction) return <CenteredAlert text="Boeking niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title={transaction.entry_number || "Boeking"}
        backButton={
          <BackButton
            onClick={() => navigate(`/finance/journal-transactions?${searchParams.toString()}`)}
            ariaLabel="Terug naar dagboek"
          />
        }
      >
        <EditButton
          onClick={() => navigate(`/finance/journal-transactions/${id}/edit?${searchParams.toString()}`)}
          showText
          size="normal"
          ariaLabel="Boeking bewerken"
        />
        <DeleteButton onClick={handleDelete} showText size="normal" ariaLabel="Boeking verwijderen" />
      </PageHeader>

      <DetailCard title="Boekingsdetails" className="mb-6">
        <DetailBlock>
          <Row>
            <Label>Datum</Label>
            <Value>{transaction.transaction_date?.slice(0, 10) || "-"}</Value>
          </Row>
          <Row>
            <Label>Boekjaar</Label>
            <Value>{transaction.expand?.fiscal_year?.year_name || "-"}</Value>
          </Row>
          <Row>
            <Label>Type</Label>
            <Value>{TRANSACTION_TYPE_LABELS[transaction.transaction_type] || "-"}</Value>
          </Row>
          {transaction.description && (
            <Row>
              <Label>Omschrijving</Label>
              <Value>{transaction.description}</Value>
            </Row>
          )}
        </DetailBlock>
      </DetailCard>

      {/* Journal entries */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Boekingsregels ({entries.length})</h3>
          {!isBalanced && entries.length > 0 && (
            <span className="text-sm text-red-600 dark:text-red-400 font-medium">
              Niet in balans (verschil: {formatCurrency(totalDebit - totalCredit)})
            </span>
          )}
          {isBalanced && entries.length > 0 && (
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">In balans</span>
          )}
        </div>

        {/* Entries table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Rekening</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-32">Debet</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-32">Credit</th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {entries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    Geen boekingsregels. Voeg er een toe hieronder.
                  </td>
                </tr>
              )}
              {entries.map((entry) => {
                const account = entry.expand?.ledger_account;
                return (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {account ? `${account.account_number} – ${account.name}` : entry.ledger_account}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                      {entry.debit ? formatCurrency(entry.debit) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                      {entry.credit ? formatCurrency(entry.credit) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Verwijder regel"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
              {entries.length > 0 && (
                <tr className="bg-gray-50 dark:bg-gray-800 font-medium border-t-2 border-gray-300 dark:border-gray-600">
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">Totaal</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(totalDebit)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
                    {formatCurrency(totalCredit)}
                  </td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Add entry form */}
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Boekingsregel toevoegen</h4>
          <form onSubmit={handleAddEntry} className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-48">
              <Label htmlFor="new_account">Grootboekrekening</Label>
              <Select
                id="new_account"
                value={newEntry.ledger_account}
                onChange={(e) => setNewEntry({ ...newEntry, ledger_account: e.target.value })}
              >
                <option value="">Selecteer rekening</option>
                {ledgerAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_number} – {a.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-32">
              <Label htmlFor="new_debit">Debet (€)</Label>
              <Input
                id="new_debit"
                type="number"
                step="0.01"
                min="0"
                value={newEntry.debit}
                onChange={(e) => setNewEntry({ ...newEntry, debit: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="w-32">
              <Label htmlFor="new_credit">Credit (€)</Label>
              <Input
                id="new_credit"
                type="number"
                step="0.01"
                min="0"
                value={newEntry.credit}
                onChange={(e) => setNewEntry({ ...newEntry, credit: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <Button type="submit" disabled={savingEntry} color="green" text={savingEntry ? "..." : "Toevoegen"} />
          </form>
        </div>
      </div>
    </PageContent>
  );
};

export default JournalTransactionDetail;
