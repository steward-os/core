import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "../../../components/Button/Button";
import Label from "../../../components/Form/Label";
import Select from "../../../components/Form/Select";
import DialogPanel from "../../../components/Modal/DialogPanel";
import { getAllLedgerAccounts } from "../../../services/ledgerAccountService";
import { computeClosingPreview, closeYear } from "../../../services/yearCloseService";

const CloseYearDialog = ({ open, fiscalYear, onClose }) => {
  const queryClient = useQueryClient();

  const [equityAccounts, setEquityAccounts] = useState([]);
  const [selectedEquityAccountId, setSelectedEquityAccountId] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !fiscalYear) return;

    setError(null);
    setPreview(null);
    setSelectedEquityAccountId("");
    setLoading(true);

    Promise.all([
      computeClosingPreview(fiscalYear.id),
      getAllLedgerAccounts({ filter: `category = "EQUITY"`, sort: "account_number" }),
    ])
      .then(([previewData, accounts]) => {
        setPreview(previewData);
        setEquityAccounts(accounts);
      })
      .catch((err) => { if (!err?.isAbort) setError(err?.message || "Laden mislukt."); })
      .finally(() => setLoading(false));
  }, [open, fiscalYear]);

  const handleConfirm = async () => {
    if (!selectedEquityAccountId) return;

    setSaving(true);
    setError(null);
    try {
      await closeYear(fiscalYear.id, selectedEquityAccountId);
      queryClient.invalidateQueries({ queryKey: ["fiscalYears"] });
      queryClient.invalidateQueries({ queryKey: ["journalTransactions"] });
      onClose();
    } catch (err) {
      setError(err.message);
    }
    setSaving(false);
  };

  const formatAmount = (amount) =>
    new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);

  return (
    <DialogPanel open={open} onClose={onClose} title={`Boekjaar afsluiten — ${fiscalYear?.year_name || ""}`}>
      {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Laden...</p>}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
      )}

      {!loading && preview && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            De volgende afsluitboekingen worden aangemaakt om alle baten- en lastenrekeningen op nul te zetten.
            {preview.nextFiscalYear
              ? ` De sluitende saldi van activa, passiva en eigen vermogen worden als openingsboekingen overgezet naar boekjaar "${preview.nextFiscalYear.year_name}".`
              : ` Er is nog geen volgend boekjaar — dit wordt automatisch aangemaakt.`}
          </p>

          {/* Closing lines table */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden text-sm">
            <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 flex font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1">Rekening</div>
              <div className="w-28 text-right">Debet</div>
              <div className="w-28 text-right">Credit</div>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {preview.lines.map((line) => (
                <div key={line.accountId} className="px-3 py-2 flex text-gray-800 dark:text-gray-200">
                  <div className="flex-1">
                    {line.accountNumber} — {line.accountName}
                  </div>
                  <div className="w-28 text-right">
                    {line.closingDebit > 0 ? formatAmount(line.closingDebit) : ""}
                  </div>
                  <div className="w-28 text-right">
                    {line.closingCredit > 0 ? formatAmount(line.closingCredit) : ""}
                  </div>
                </div>
              ))}
              {preview.lines.length === 0 && (
                <div className="px-3 py-2 text-gray-500 dark:text-gray-400 italic">
                  Geen baten- of lastenrekeningen met saldo gevonden.
                </div>
              )}
            </div>
          </div>

          {/* Net result */}
          <div className="flex justify-between items-center text-sm font-medium border-t border-gray-200 dark:border-gray-700 pt-3">
            <span className="text-gray-700 dark:text-gray-300">
              {preview.netResult >= 0 ? "Resultaat (winst):" : "Resultaat (verlies):"}
            </span>
            <span className={preview.netResult >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
              {formatAmount(Math.abs(preview.netResult))}
            </span>
          </div>

          {/* Equity account selector */}
          <div>
            <Label htmlFor="equity-account" required>
              Boek resultaat naar
            </Label>
            <Select
              id="equity-account"
              value={selectedEquityAccountId}
              onChange={(e) => setSelectedEquityAccountId(e.target.value)}
              disabled={saving}
            >
              <option value="">Selecteer eigen vermogen rekening...</option>
              {equityAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.account_number} — {account.name}
                </option>
              ))}
            </Select>
            {equityAccounts.length === 0 && !loading && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Geen eigen vermogen rekeningen gevonden. Maak eerst een rekening aan met categorie &ldquo;EQUITY&rdquo;.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <div className="flex-1" />
            <Button type="button" onClick={onClose} color="gray" text="Annuleren" disabled={saving} />
            <Button
              type="button"
              onClick={handleConfirm}
              color="blue"
              text={saving ? "Afsluiten..." : "Boekjaar afsluiten"}
              disabled={saving || !selectedEquityAccountId}
            />
          </div>
        </div>
      )}
    </DialogPanel>
  );
};

export default CloseYearDialog;
