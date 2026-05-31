import { useState, useEffect } from "react";
import CenteredSpinner from "../../../components/CenteredSpinner";
import DialogPanel from "../../../components/Modal/DialogPanel";
import PageContent from "../../../components/Page/PageContent";
import PageHeader from "../../../components/Page/PageHeader";
import Label from "../../../components/Form/Label";
import Input from "../../../components/Form/Input";
import { getAllLedgerAccounts } from "../../../services/ledgerAccountService";
import { getAllJournalEntries } from "../../../services/journalTransactionService";
import { LEDGER_CATEGORY_LABELS } from "../../../utils/financeConstants";
import LedgerAccountDetailView from "../LedgerAccount/LedgerAccountDetailView";

const EURO = (v) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(v ?? 0);

// Returns Tailwind color classes for a saldo cell based on account category and side.
// ASSETS/EQUITY/REVENUE growing in their normal direction = green; LIABILITIES/EXPENSES = red.
const saldoColor = (category, side) => {
  const greenDebit = category === "ASSETS";
  const greenCredit = category === "EQUITY" || category === "REVENUE";
  if (side === "debit") return greenDebit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  if (side === "credit") return greenCredit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  return "";
};

const today = new Date().toISOString().slice(0, 10);
const fiscalYearStart = `${new Date().getFullYear()}-01-01`;

const TrialBalance = () => {
  const [startDate, setStartDate] = useState(fiscalYearStart);
  const [selectedDate, setSelectedDate] = useState(today);
  const [accounts, setAccounts] = useState([]);
  const [entriesByAccount, setEntriesByAccount] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [modalAccountName, setModalAccountName] = useState("");

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);
    setError(null);

    const toMap = (entries) => {
      const byAccount = {};
      entries.forEach((e) => {
        if (!byAccount[e.ledger_account]) byAccount[e.ledger_account] = [];
        byAccount[e.ledger_account].push(e);
      });
      return byAccount;
    };

    const filterParts = [`journal_transaction.transaction_date <= "${selectedDate} 23:59:59"`];
    if (startDate) filterParts.push(`journal_transaction.transaction_date >= "${startDate}"`);

    Promise.all([
      getAllLedgerAccounts({ sort: "account_number" }),
      getAllJournalEntries({
        filter: filterParts.join(" && "),
        expand: "journal_transaction",
      }),
    ])
      .then(([accts, allEntries]) => {
        // Exclude closing entries — same approach as P&L in FinancialOverview
        const entries = allEntries.filter((e) => !e.expand?.journal_transaction?.is_closing);
        setAccounts(accts);
        setEntriesByAccount(toMap(entries));
      })
      .catch((err) => {
        if (!err?.isAbort) setError(err);
      })
      .finally(() => setLoading(false));
  }, [selectedDate, startDate]);

  const rows = accounts
    .map((a) => {
      const entries = entriesByAccount[a.id] || [];
      const debit = entries.reduce((s, e) => s + (e.debit || 0), 0);
      const credit = entries.reduce((s, e) => s + (e.credit || 0), 0);
      const net = debit - credit;
      const saldoDebit = net > 0.005 ? net : 0;
      const saldoCredit = net < -0.005 ? -net : 0;
      return { ...a, debit, credit, saldoDebit, saldoCredit };
    })
    .filter((a) => a.debit >= 0.005 || a.credit >= 0.005);

  const grandDebit = rows.reduce((s, r) => s + r.debit, 0);
  const grandCredit = rows.reduce((s, r) => s + r.credit, 0);
  const grandSaldoDebit = rows.reduce((s, r) => s + r.saldoDebit, 0);
  const grandSaldoCredit = rows.reduce((s, r) => s + r.saldoCredit, 0);
  const isBalanced = Math.abs(grandDebit - grandCredit) < 0.005;

  return (
    <PageContent className="pt-6">
      <PageHeader title="Proef- en saldi balans" />

      <div className="mb-6 flex gap-4 flex-wrap">
        <div>
          <Label htmlFor="start-date">Begindatum</Label>
          <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="report-date">Einddatum</Label>
          <Input id="report-date" type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
      </div>

      {loading && <CenteredSpinner />}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 mb-6">
          Fout bij laden: {error.message}
        </div>
      )}

      {!loading && !error && selectedDate && (
        <>
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              Geen boekingen gevonden tot en met deze datum.
            </p>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 px-4 text-left font-medium text-gray-600 dark:text-gray-400 w-16">Nr.</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 dark:text-gray-400">Naam</th>
                    <th className="py-3 px-4 text-left font-medium text-gray-600 dark:text-gray-400 w-36">Categorie</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-600 dark:text-gray-400 w-36">Debet</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-600 dark:text-gray-400 w-36">Credit</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-600 dark:text-gray-400 w-36">Saldo D</th>
                    <th className="py-3 px-4 text-right font-medium text-gray-600 dark:text-gray-400 w-36">Saldo C</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rows.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer group" onClick={() => { setSelectedAccountId(a.id); setModalAccountName(`${a.account_number} – ${a.name}`); }}>
                      <td className="py-2 px-4 font-mono text-xs text-gray-400 dark:text-gray-500">
                        {a.account_number}
                      </td>
                      <td className="py-2 px-4 text-gray-800 dark:text-gray-200 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">{a.name}</td>
                      <td className="py-2 px-4 text-gray-500 dark:text-gray-400">
                        {LEDGER_CATEGORY_LABELS[a.category] ?? a.category}
                      </td>
                      <td className="py-2 px-4 text-right tabular-nums text-gray-900 dark:text-gray-100">
                        {a.debit >= 0.005 ? EURO(a.debit) : ""}
                      </td>
                      <td className="py-2 px-4 text-right tabular-nums text-gray-900 dark:text-gray-100">
                        {a.credit >= 0.005 ? EURO(a.credit) : ""}
                      </td>
                      <td className={`py-2 px-4 text-right tabular-nums ${saldoColor(a.category, "debit")}`}>
                        {a.saldoDebit >= 0.005 ? EURO(a.saldoDebit) : ""}
                      </td>
                      <td className={`py-2 px-4 text-right tabular-nums ${saldoColor(a.category, "credit")}`}>
                        {a.saldoCredit >= 0.005 ? EURO(a.saldoCredit) : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-semibold">
                    <td colSpan={3} className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      Totaal
                    </td>
                    <td
                      className={`py-3 px-4 text-right tabular-nums w-36 ${
                        isBalanced ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {EURO(grandDebit)}
                    </td>
                    <td
                      className={`py-3 px-4 text-right tabular-nums w-36 ${
                        isBalanced ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {EURO(grandCredit)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums w-36 text-gray-700 dark:text-gray-300">
                      {EURO(grandSaldoDebit)}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums w-36 text-gray-700 dark:text-gray-300">
                      {EURO(grandSaldoCredit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {!isBalanced && rows.length > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
              Proefbalans klopt niet — verschil: {EURO(Math.abs(grandDebit - grandCredit))}
            </div>
          )}
        </>
      )}
      <DialogPanel
        open={!!selectedAccountId}
        onClose={() => setSelectedAccountId(null)}
        title={modalAccountName || "Rekening detail"}
        noScroll={true}
      >
        {selectedAccountId && (
          <LedgerAccountDetailView
            accountId={selectedAccountId}
            onAccountLoaded={(a) => setModalAccountName(`${a.account_number} – ${a.name}`)}
          />
        )}
      </DialogPanel>
    </PageContent>
  );
};

export default TrialBalance;
