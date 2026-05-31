import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CenteredAlert from "../../../components/CenteredAlert";
import CenteredSpinner from "../../../components/CenteredSpinner";
import DetailBlock, { Label, Row, Value } from "../../../components/Detail/DetailBlock";
import DetailCard from "../../../components/Detail/DetailCard";
import { createBudget, getBudget, updateBudget } from "../../../services/budgetService";
import { getAllFiscalYears } from "../../../services/fiscalYearService";
import { getEntriesByLedgerAccount } from "../../../services/journalTransactionService";
import { getLedgerAccount } from "../../../services/ledgerAccountService";
import { LEDGER_CATEGORY_LABELS } from "../../../utils/financeConstants";

const formatCurrency = (val) =>
  val !== undefined && val !== null
    ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(val)
    : "-";

const LedgerAccountDetailView = ({ accountId, onAccountLoaded }) => {
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [fiscalYears, setFiscalYears] = useState([]);
  const [entries, setEntries] = useState([]);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const MONTHS = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
  const emptyBudget = () => Object.fromEntries(MONTHS.map((_, i) => [`budget_${String(i + 1).padStart(2, "0")}`, ""]));

  const [budgetRecord, setBudgetRecord] = useState(null);
  const [budgetData, setBudgetData] = useState(emptyBudget());
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetSaved, setBudgetSaved] = useState(false);

  useEffect(() => {
    const fetchBase = async () => {
      try {
        const [accountData, yearsData] = await Promise.all([
          getLedgerAccount(accountId),
          getAllFiscalYears({ sort: "-start_date" }),
        ]);
        setAccount(accountData);
        if (onAccountLoaded) onAccountLoaded(accountData);
        setFiscalYears(yearsData);
        if (yearsData.length > 0) {
          setSelectedFiscalYear(yearsData[0].id);
        }
      } catch (err) {
        if (err?.isAbort) return;
        setLoadError(err);
        setLoading(false);
      }
    };
    fetchBase();
  }, [accountId]);

  useEffect(() => {
    if (!account) return;
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const options = {};
        if (selectedFiscalYear) {
          options.filter = `ledger_account = "${accountId}" && journal_transaction.fiscal_year = "${selectedFiscalYear}"`;
        }
        const data = await getEntriesByLedgerAccount(accountId, options);
        setEntries(data);
      } catch (err) {
        if (err?.isAbort) return;
        setLoadError(err);
      }
      setLoading(false);
    };
    fetchEntries();
  }, [accountId, account, selectedFiscalYear]);

  useEffect(() => {
    if (!selectedFiscalYear) return;
    const fetchBudget = async () => {
      setBudgetLoading(true);
      try {
        const record = await getBudget(selectedFiscalYear, accountId);
        setBudgetRecord(record);
        if (record) {
          setBudgetData(
            Object.fromEntries(
              MONTHS.map((_, i) => {
                const key = `budget_${String(i + 1).padStart(2, "0")}`;
                return [key, record[key] ?? ""];
              }),
            ),
          );
        } else {
          setBudgetData(emptyBudget());
        }
      } catch (err) {
        if (err?.isAbort) return;
      }
      setBudgetLoading(false);
    };
    fetchBudget();
  }, [selectedFiscalYear, accountId]);

  const handleBudgetSave = async () => {
    setBudgetSaving(true);
    try {
      const payload = {
        fiscal_year: selectedFiscalYear,
        fi_ledger_account: accountId,
        ...Object.fromEntries(Object.entries(budgetData).map(([k, v]) => [k, v === "" ? null : parseFloat(v)])),
      };
      if (budgetRecord) {
        const updated = await updateBudget(budgetRecord.id, payload);
        setBudgetRecord(updated);
      } else {
        const created = await createBudget(payload);
        setBudgetRecord(created);
      }
      setBudgetSaved(true);
      setTimeout(() => setBudgetSaved(false), 2000);
    } catch (err) {
      console.error("Budget save error", err);
    }
    setBudgetSaving(false);
  };

  const [activeTab, setActiveTab] = useState("transactions");

  const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);
  const netBalance = totalDebit - totalCredit;

  // Build entries with running balance
  let runningBalance = 0;
  const entriesWithBalance = entries.map((entry) => {
    runningBalance += (entry.debit || 0) - (entry.credit || 0);
    return { ...entry, runningBalance };
  });

  if (loadError)
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm">
        <p className="font-semibold text-red-700 dark:text-red-400 mb-2">Fout bij laden</p>
        <p className="text-red-600 dark:text-red-300">{loadError.message}</p>
      </div>
    );

  if (!account && !loadError) return <CenteredSpinner />;
  if (!account) return <CenteredAlert text="Rekening niet gevonden." />;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Fixed Header Section (Account Info & Tabs) */}
      <div className="flex-shrink-0">
        <DetailCard title="Rekeninginformatie" className="mb-4">
          <DetailBlock>
            <Row>
              <Label>Categorie</Label>
              <Value>{LEDGER_CATEGORY_LABELS[account.category] || account.category || "-"}</Value>
            </Row>
            <Row>
              <Label>Systeem</Label>
              <Value>{account.is_system ? "Ja" : "Nee"}</Value>
            </Row>
            <Row>
              <Label>Bankrekening</Label>
              <Value>{account.is_bank_account ? "Ja" : "Nee"}</Value>
            </Row>
            <Row>
              <Label>Tussenrekening</Label>
              <Value>{account.is_suspense_account ? "Ja" : "Nee"}</Value>
            </Row>
          </DetailBlock>
        </DetailCard>

        {/* Tabs & Fiscal Year Selector */}
        <div className="flex items-end justify-between border-b border-gray-200 dark:border-gray-700 mb-4">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab("transactions")}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "transactions"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Transacties
            </button>
            <button
              onClick={() => setActiveTab("budget")}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "budget"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              Budget
            </button>
          </nav>
          <div className="pb-2">
            <select
              value={selectedFiscalYear}
              onChange={(e) => setSelectedFiscalYear(e.target.value)}
              className="text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {fiscalYears.map((fy) => (
                <option key={fy.id} value={fy.id}>
                  {fy.year_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-auto">
        {activeTab === "transactions" && (
          <div className="md:glass-panel md:rounded-xl md:shadow-sm border border-gray-200 dark:border-gray-700 h-fit">
            <table className="w-full text-sm border-separate border-spacing-0">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-28 border-b border-gray-200 dark:border-gray-700">
                    Datum
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-28 border-b border-gray-200 dark:border-gray-700">
                    Boeknummer
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    Omschrijving
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-28 border-b border-gray-200 dark:border-gray-700">
                    Debet
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-28 border-b border-gray-200 dark:border-gray-700">
                    Credit
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-28 border-b border-gray-200 dark:border-gray-700">
                    Saldo
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {entriesWithBalance.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Geen boekingen gevonden voor deze rekening.
                    </td>
                  </tr>
                )}
                {entriesWithBalance.map((entry) => {
                  const tx = entry.expand?.journal_transaction;
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => navigate(`/finance/journal-transactions/${entry.journal_transaction}`)}
                    >
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {tx?.transaction_date?.slice(0, 10) || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {tx?.entry_number || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{tx?.description || "-"}</td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {entry.debit ? formatCurrency(entry.debit) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {entry.credit ? formatCurrency(entry.credit) : "-"}
                      </td>
                      <td
                        className={`px-4 py-3 text-right font-medium whitespace-nowrap ${
                          entry.runningBalance >= 0
                            ? "text-gray-900 dark:text-gray-100"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {formatCurrency(entry.runningBalance)}
                      </td>
                    </tr>
                  );
                })}
                {entriesWithBalance.length > 0 && (
                  <tr className="bg-gray-50 dark:bg-gray-800 font-semibold border-t-2 border-gray-300 dark:border-gray-600 sticky bottom-0 z-10">
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700"
                    >
                      Totaal ({entries.length} {entries.length === 1 ? "boeking" : "boekingen"})
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 border-t border-gray-200 dark:border-gray-700">
                      {formatCurrency(totalDebit)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 border-t border-gray-200 dark:border-gray-700">
                      {formatCurrency(totalCredit)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold border-t border-gray-200 dark:border-gray-700 ${
                        netBalance >= 0 ? "text-gray-900 dark:text-gray-100" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatCurrency(netBalance)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activeTab === "budget" && (
        <div className="md:glass-panel md:rounded-xl md:shadow-sm md:overflow-hidden p-4">
          {!selectedFiscalYear ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Selecteer een boekjaar om het budget te bekijken.
            </p>
          ) : budgetLoading ? (
            <CenteredSpinner />
          ) : (
            <>
              <div className="flex gap-3 mb-6">
                {/* Left: inputs + bars sharing the same width */}
                <div className="flex-1 flex flex-col gap-6">
                  {/* Input row */}
                  <div className="grid grid-cols-12 gap-2">
                    {MONTHS.map((month, i) => {
                      const key = `budget_${String(i + 1).padStart(2, "0")}`;
                      return (
                        <div key={key} className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center">
                            {month}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={budgetData[key]}
                            onChange={(e) => setBudgetData((prev) => ({ ...prev, [key]: e.target.value }))}
                            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm px-2 py-1.5 text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0,00"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Cumulative budget vs actual bars */}
                  {(() => {
                    const GREEN_CATEGORIES = ["ASSETS", "EQUITY", "REVENUE"];
                    const actualColor = GREEN_CATEGORIES.includes(account.category)
                      ? {
                          bar: "bg-emerald-400 dark:bg-emerald-500",
                          text: "text-emerald-600 dark:text-emerald-400",
                          swatch: "bg-emerald-400 dark:bg-emerald-500",
                        }
                      : {
                          bar: "bg-orange-400 dark:bg-orange-500",
                          text: "text-orange-600 dark:text-orange-400",
                          swatch: "bg-orange-400 dark:bg-orange-500",
                        };

                    const startingBalance = 0;
                    const BAR_HEIGHT = 80;

                    const cumBudget = MONTHS.map((_, i) =>
                      MONTHS.slice(0, i + 1).reduce((acc, __, j) => {
                        const key = `budget_${String(j + 1).padStart(2, "0")}`;
                        return acc + (parseFloat(budgetData[key]) || 0);
                      }, startingBalance),
                    );

                    const monthlyActuals = Array(12).fill(0);
                    entries.forEach((entry) => {
                      const tx = entry.expand?.journal_transaction;
                      if (!tx?.transaction_date) return;
                      const m = parseInt(tx.transaction_date.slice(5, 7), 10) - 1;
                      if (m >= 0 && m < 12) {
                        monthlyActuals[m] += (entry.debit || 0) - (entry.credit || 0);
                      }
                    });
                    const cumActual = monthlyActuals.map((_, i) =>
                      monthlyActuals.slice(0, i + 1).reduce((acc, v) => acc + v, startingBalance),
                    );

                    const allVals = [...cumBudget, ...cumActual];
                    const maxVal = Math.max(...allVals, 0);
                    const minVal = Math.min(...allVals, 0);
                    const range = Math.max(maxVal - minVal, 1);
                    const zeroY = (maxVal / range) * BAR_HEIGHT;
                    const barTop = (val) => (val >= 0 ? ((maxVal - val) / range) * BAR_HEIGHT : zeroY);
                    const barH = (val) => (Math.abs(val) / range) * BAR_HEIGHT;
                    const compactFmt = new Intl.NumberFormat("nl-NL", {
                      notation: "compact",
                      maximumFractionDigits: 1,
                    });

                    return (
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Cumulatief budget vs werkelijk
                          </p>
                          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className="inline-block w-3 h-3 rounded-sm bg-blue-400 dark:bg-blue-500" /> Budget
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <span className={`inline-block w-3 h-3 rounded-sm ${actualColor.swatch}`} /> Werkelijk
                          </span>
                        </div>
                        <div className="grid grid-cols-12 gap-2">
                          {MONTHS.map((_, i) => {
                            const bVal = cumBudget[i];
                            const aVal = cumActual[i];
                            return (
                              <div key={i} className="flex flex-col items-center gap-1">
                                <div className="w-full relative flex gap-0.5" style={{ height: BAR_HEIGHT + 4 }}>
                                  <div
                                    className="absolute left-0 right-0 border-t border-gray-300 dark:border-gray-600 z-10"
                                    style={{ top: zeroY }}
                                  />
                                  <div className="relative flex-1">
                                    <div
                                      className={`absolute inset-x-0 rounded-sm ${bVal < 0 ? "bg-red-400 dark:bg-red-500" : "bg-blue-400 dark:bg-blue-500"}`}
                                      style={{ top: barTop(bVal), height: barH(bVal) }}
                                    />
                                  </div>
                                  <div className="relative flex-1">
                                    <div
                                      className={`absolute inset-x-0 rounded-sm ${actualColor.bar}`}
                                      style={{ top: barTop(aVal), height: barH(aVal) }}
                                    />
                                  </div>
                                </div>
                                <span className="text-xs tabular-nums text-blue-600 dark:text-blue-400">
                                  {compactFmt.format(bVal)}
                                </span>
                                <span className={`text-xs tabular-nums ${actualColor.text}`}>
                                  {compactFmt.format(aVal)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
                {/* end left flex-1 */}

                {/* Right: save button aligned to input row */}
                <div className="shrink-0 flex flex-col justify-start pt-5">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleBudgetSave}
                      disabled={budgetSaving}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded transition-colors"
                    >
                      {budgetSaving ? "Opslaan..." : "Opslaan"}
                    </button>
                    {budgetSaved && <span className="text-sm text-green-600 dark:text-green-400">✓</span>}
                  </div>
                </div>
              </div>
              {/* end outer flex */}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default LedgerAccountDetailView;
