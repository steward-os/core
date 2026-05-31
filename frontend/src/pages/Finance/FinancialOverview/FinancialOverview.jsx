import { useEffect, useState } from "react";
import CenteredSpinner from "../../../components/CenteredSpinner";
import Input from "../../../components/Form/Input";
import Label from "../../../components/Form/Label";
import Select from "../../../components/Form/Select";
import DialogPanel from "../../../components/Modal/DialogPanel";
import PageContent from "../../../components/Page/PageContent";
import PageHeader from "../../../components/Page/PageHeader";
import { getAllFiscalYears } from "../../../services/fiscalYearService";
import { getAllJournalEntries } from "../../../services/journalTransactionService";
import { getAllLedgerAccounts } from "../../../services/ledgerAccountService";
import { LEDGER_SUB_CATEGORY_LABELS } from "../../../utils/financeConstants";
import LedgerAccountDetailView from "../LedgerAccount/LedgerAccountDetailView";

const EURO = (v) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(v ?? 0);

// Categories where credit > debit = positive balance
const CREDIT_NORMAL = new Set(["LIABILITIES", "EQUITY", "REVENUE"]);

function computeBalance(account, entriesByAccount) {
  const entries = entriesByAccount[account.id] || [];
  const debit = entries.reduce((s, e) => s + (e.debit || 0), 0);
  const credit = entries.reduce((s, e) => s + (e.credit || 0), 0);
  return CREDIT_NORMAL.has(account.category) ? credit - debit : debit - credit;
}

function AccountRow({ account, entriesByAccount, onClick }) {
  return (
    <tr
      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer group"
      onClick={() => onClick(account)}
    >
      <td className="py-1.5 pr-3 font-mono text-xs text-gray-400 dark:text-gray-500 w-14">{account.account_number}</td>
      <td className="py-1.5 text-gray-700 dark:text-gray-300 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400">
        {account.name}
      </td>
      <td className="py-1.5 pl-4 text-right tabular-nums text-gray-900 dark:text-gray-100 w-32">
        {EURO(computeBalance(account, entriesByAccount))}
      </td>
    </tr>
  );
}

// virtualRows: [{ label, amount }] — synthetic entries not backed by real accounts
function AccountTable({ accounts, entriesByAccount, emptyMessage, onClickAccount, virtualRows = [] }) {
  const rows = accounts.filter((a) => Math.abs(computeBalance(a, entriesByAccount)) >= 0.005);
  const activeVirtualRows = virtualRows.filter((r) => Math.abs(r.amount) >= 0.005);
  const isEmpty = rows.length === 0 && activeVirtualRows.length === 0;
  const total =
    rows.reduce((s, a) => s + computeBalance(a, entriesByAccount), 0) +
    activeVirtualRows.reduce((s, r) => s + r.amount, 0);

  if (isEmpty) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 py-3 italic">{emptyMessage || "Geen saldi"}</p>;
  }

  // Group by sub_category, preserving account_number order
  const groupOrder = [];
  const groups = {};
  rows.forEach((a) => {
    const key = a.sub_category || "";
    if (!groups[key]) {
      groups[key] = [];
      groupOrder.push(key);
    }
    groups[key].push(a);
  });

  const hasGroups = groupOrder.length > 1 || (groupOrder.length === 1 && groupOrder[0] !== "");

  return (
    <table className="w-full text-sm">
      <tbody>
        {hasGroups ? groupOrder.map((key, gi) => {
          const groupAccounts = groups[key];
          const subTotal = groupAccounts.reduce((s, a) => s + computeBalance(a, entriesByAccount), 0);
          const label = key ? (LEDGER_SUB_CATEGORY_LABELS[key] || key) : "Overig";
          return (
            <>
              <tr key={`hdr-${key}`}>
                <td
                  colSpan={3}
                  className={`pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 ${gi > 0 ? "pt-5" : "pt-0"}`}
                >
                  {label}
                </td>
              </tr>
              {groupAccounts.map((a) => (
                <AccountRow
                  key={a.id}
                  account={a}
                  entriesByAccount={entriesByAccount}
                  onClick={onClickAccount}
                />
              ))}
              <tr key={`sub-${key}`} className="border-t border-gray-200 dark:border-gray-700">
                <td className="pt-1.5 pb-2 w-14" />
                <td className="pt-1.5 pb-2 text-gray-500 dark:text-gray-400 italic">Subtotaal {label}</td>
                <td className="pt-1.5 pb-2 pl-4 text-right tabular-nums font-semibold text-gray-800 dark:text-gray-200 w-32">
                  {EURO(subTotal)}
                </td>
              </tr>
            </>
          );
        }) : rows.map((a) => (
          <AccountRow
            key={a.id}
            account={a}
            entriesByAccount={entriesByAccount}
            onClick={onClickAccount}
          />
        ))}

        {activeVirtualRows.map((r) => (
          <tr key={r.label} className="italic">
            <td className="py-1.5 pr-3 w-14" />
            <td className="py-1.5 text-gray-500 dark:text-gray-400">
              {r.label}
              <span className="ml-1.5 text-xs not-italic bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 px-1 rounded">
                virtueel
              </span>
            </td>
            <td
              className={`py-1.5 pl-4 text-right tabular-nums font-medium w-32 ${r.amount >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                }`}
            >
              {EURO(r.amount)}
            </td>
          </tr>
        ))}

        <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-semibold">
          <td colSpan={2} className="pt-3 pb-1 text-gray-700 dark:text-gray-300">
            Totaal
          </td>
          <td className="pt-3 pb-1 pl-4 text-right tabular-nums text-gray-900 dark:text-gray-100 w-32">
            {EURO(total)}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function SectionCard({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
      <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        {title}
      </h3>
      {children}
    </div>
  );
}

const FinancialOverview = () => {
  const [filterMode, setFilterMode] = useState("year"); // "year" | "date"
  const [fiscalYears, setFiscalYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [accounts, setAccounts] = useState([]);
  // entriesByAccount: all entries incl. closing — used for balance sheet
  const [entriesByAccount, setEntriesByAccount] = useState({});
  // entriesByAccountPL: entries excluding closing transactions — used for P&L
  const [entriesByAccountPL, setEntriesByAccountPL] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [modalAccountName, setModalAccountName] = useState("");

  useEffect(() => {
    getAllFiscalYears({ sort: "-start_date" }).then((years) => {
      setFiscalYears(years);
      if (years.length > 0) setSelectedYear(years[0].id);
    });
  }, []);

  useEffect(() => {
    const isDateMode = filterMode === "date";
    if (!isDateMode && !selectedYear) return;
    if (isDateMode && !selectedDate) return;

    setLoading(true);
    setError(null);

    const filter = isDateMode
      ? `journal_transaction.transaction_date <= "${selectedDate}"`
      : `journal_transaction.fiscal_year = "${selectedYear}"`;

    const toMap = (entries) => {
      const byAccount = {};
      entries.forEach((e) => {
        if (!byAccount[e.ledger_account]) byAccount[e.ledger_account] = [];
        byAccount[e.ledger_account].push(e);
      });
      return byAccount;
    };

    Promise.all([
      getAllLedgerAccounts({ sort: "account_number" }),
      getAllJournalEntries({ filter, expand: "journal_transaction" }),
    ])
      .then(([accts, allEntries]) => {
        // P&L entries exclude closing transactions — filter in memory to avoid PocketBase != quirks
        const plEntries = allEntries.filter((e) => !e.expand?.journal_transaction?.is_closing);
        setAccounts(accts);
        setEntriesByAccount(toMap(allEntries));
        setEntriesByAccountPL(toMap(plEntries));
      })
      .catch((err) => {
        if (!err?.isAbort) setError(err);
      })
      .finally(() => setLoading(false));
  }, [filterMode, selectedYear, selectedDate]);

  // Group accounts by category
  const byCategory = {};
  accounts.forEach((a) => {
    if (!byCategory[a.category]) byCategory[a.category] = [];
    byCategory[a.category].push(a);
  });

  const totalFor = (cat, map) => (byCategory[cat] || []).reduce((s, a) => s + computeBalance(a, map), 0);

  const selectedYearData = fiscalYears.find((y) => y.id === selectedYear);
  const isYearLocked = filterMode === "year" ? (selectedYearData?.is_locked ?? false) : false;

  // Balance sheet uses all entries (incl. closing) so equity reflects post-closing state
  const totalActiva = totalFor("ASSETS", entriesByAccount);
  const totalPassiva = totalFor("LIABILITIES", entriesByAccount);
  const totalEigenVermogen = totalFor("EQUITY", entriesByAccount);

  // P&L uses entries excluding closing so revenue/expense show original values
  const totalBaten = totalFor("REVENUE", entriesByAccountPL);
  const totalLasten = totalFor("EXPENSES", entriesByAccountPL);
  const resultaat = totalBaten - totalLasten;

  // For open years: add virtual resultaat to credit side (not yet booked to equity)
  // For closed years: resultaat is already in equity via closing entry
  const totalCreditZijde = totalPassiva + totalEigenVermogen + (isYearLocked ? 0 : resultaat);
  const balansDiff = Math.abs(totalActiva - totalCreditZijde);
  const balansKlopt = balansDiff < 0.005;

  return (
    <PageContent wide className="pt-6">
      <PageHeader title="Financieel overzicht" />

      <div className="mb-6 max-w-xs space-y-3">
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden w-fit">
          {[
            { value: "year", label: "Boekjaar" },
            { value: "date", label: "Datum" },
          ].map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilterMode(value)}
              className={`px-4 py-1.5 text-sm font-medium transition-colors ${filterMode === value
                ? "bg-blue-600 text-white"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filterMode === "year" ? (
          <div>
            <Label htmlFor="fiscal-year">Boekjaar</Label>
            <Select id="fiscal-year" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              {fiscalYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.year_name}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div>
            <Label htmlFor="filter-date">Peildatum</Label>
            <Input
              id="filter-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        )}
      </div>

      {loading && <CenteredSpinner />}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 mb-6">
          Fout bij laden: {error.message}
        </div>
      )}

      {!loading && !error && (filterMode === "year" ? selectedYear : selectedDate) && (
        <div className="space-y-10">
          {/* ── Balans ── */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Balans</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Activa */}
              <SectionCard title="Activa">
                <AccountTable
                  accounts={byCategory["ASSETS"] || []}
                  entriesByAccount={entriesByAccount}
                  emptyMessage="Geen activa"
                  onClickAccount={(a) => setSelectedAccountId(a.id)}
                />
              </SectionCard>

              {/* Right: Passiva + Eigen Vermogen */}
              <div className="space-y-4">
                <SectionCard title="Passiva">
                  <AccountTable
                    accounts={byCategory["LIABILITIES"] || []}
                    entriesByAccount={entriesByAccount}
                    emptyMessage="Geen passiva"
                    onClickAccount={(a) => setSelectedAccountId(a.id)}
                  />
                </SectionCard>

                <SectionCard title="Eigen Vermogen">
                  <AccountTable
                    accounts={byCategory["EQUITY"] || []}
                    entriesByAccount={entriesByAccount}
                    emptyMessage="Geen eigen vermogen"
                    virtualRows={isYearLocked ? [] : [{ label: "Resultaten lopend jaar", amount: resultaat }]}
                    onClickAccount={(a) => setSelectedAccountId(a.id)}
                  />
                </SectionCard>

                {/* Passiva + EV + resultaat totaal */}
                <div className="flex justify-between items-center px-5 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold">
                  <span className="text-gray-700 dark:text-gray-300">Totaal Passiva + Eigen Vermogen</span>
                  <span
                    className={`tabular-nums ${balansKlopt ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                  >
                    {EURO(totalCreditZijde)}
                  </span>
                </div>
              </div>
            </div>

            {!balansKlopt && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
                Balans is niet in evenwicht — verschil: {EURO(balansDiff)}
              </div>
            )}
          </section>

          {/* ── Verlies- en Winstrekening ── */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Verlies- en Winstrekening</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SectionCard title="Baten">
                <AccountTable
                  accounts={byCategory["REVENUE"] || []}
                  entriesByAccount={entriesByAccountPL}
                  emptyMessage="Geen baten"
                  onClickAccount={(a) => setSelectedAccountId(a.id)}
                />
              </SectionCard>

              <SectionCard title="Lasten">
                <AccountTable
                  accounts={byCategory["EXPENSES"] || []}
                  entriesByAccount={entriesByAccountPL}
                  emptyMessage="Geen lasten"
                  onClickAccount={(a) => setSelectedAccountId(a.id)}
                />
              </SectionCard>
            </div>

            {/* Resultaat */}
            <div className="mt-4 flex justify-between items-center px-5 py-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Baten {EURO(totalBaten)} &minus; Lasten {EURO(totalLasten)}
                </p>
                <p className="text-lg font-bold text-blue-900 dark:text-blue-100 mt-0.5">
                  {resultaat >= 0 ? "Winst" : "Verlies"}
                </p>
              </div>
              <span
                className={`text-2xl font-bold tabular-nums ${resultaat >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  }`}
              >
                {EURO(resultaat)}
              </span>
            </div>
          </section>
        </div>
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

export default FinancialOverview;
