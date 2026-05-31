import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BackButton } from "../../../components/Button/BackButton";
import { CloseButton } from "../../../components/Button/CloseButton";
import { Button } from "../../../components/Button/Button";
import PageHeader from "../../../components/Page/PageHeader";
import PageContent from "../../../components/Page/PageContent";
import Label from "../../../components/Form/Label";
import Select from "../../../components/Form/Select";
import { useBulkCreateBankStatementLines } from "../../../hooks/crudResourceHooks";
import { parseMT940 } from "../../../utils/mt940Parser";

const BANK_FORMATS = [
  { value: "generic", label: "Generiek (standaard MT940)" },
  { value: "ing", label: "ING" },
  { value: "rabobank", label: "Rabobank" },
  { value: "abnamro", label: "ABN AMRO" },
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);

const BankStatementImport = () => {
  const navigate = useNavigate();
  const bulkCreateMutation = useBulkCreateBankStatementLines();

  const [bankFormat, setBankFormat] = useState("generic");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [parsedLines, setParsedLines] = useState([]);
  const [parseError, setParseError] = useState(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setParseError(null);
    setResults(null);
    setParsedLines([]);

    try {
      const content = await file.text();
      const lines = parseMT940(content, bankFormat);

      if (lines.length === 0) {
        setParseError("Geen transacties gevonden in het bestand. Controleer of het een geldig MT940 bestand is en het juiste bankformaat is gekozen.");
        return;
      }

      setParsedLines(lines);
    } catch (err) {
      console.error("Error parsing MT940 file:", err);
      setParseError("Fout bij het lezen van het MT940 bestand. Controleer of het een geldig MT940 bestand is.");
    }
  };

  const handleImport = async () => {
    if (!parsedLines.length) return;

    setImporting(true);
    try {
      const result = await bulkCreateMutation.mutateAsync({
        lines: parsedLines,
        options: { skipDuplicates },
      });
      setResults(result);
    } catch (err) {
      console.error("Import error:", err);
      setParseError("Er is een fout opgetreden tijdens de import.");
    }
    setImporting(false);
  };

  const preview = parsedLines.slice(0, 10);

  return (
    <PageContent fullWidth>
      <PageHeader
        title="MT940 importeren"
        variant="edit"
        backButton={
          <BackButton onClick={() => navigate("/finance/bank-statement-lines")} ariaLabel="Terug naar bankafschriften" />
        }
      >
        <CloseButton
          onClick={() => navigate("/finance/bank-statement-lines")}
          size="normal"
          ariaLabel="Terug naar bankafschriften"
        />
      </PageHeader>

      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Instructies</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• Upload een MT940 bankafschriftbestand (.sta, .mt940 of .txt)</li>
            <li>• Kies het juiste bankformaat voor een correcte omschrijving</li>
            <li>• Met duplicaatcontrole worden regels met dezelfde datum en hetzelfde bedrag overgeslagen</li>
            <li>• Controleer de preview voor het importeren</li>
          </ul>
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="bankFormat">Bankformaat</Label>
            <Select
              id="bankFormat"
              value={bankFormat}
              onChange={(e) => setBankFormat(e.target.value)}
            >
              {BANK_FORMATS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </Select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-[var(--text-primary)]">Duplicaten overslaan (zelfde datum + bedrag)</span>
            </label>
          </div>
        </div>

        {/* File upload */}
        <div>
          <Label>MT940 bestand selecteren</Label>
          <input
            type="file"
            accept=".sta,.mt940,.txt"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
          />
        </div>

        {/* Parse error */}
        {parseError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-300">{parseError}</p>
          </div>
        )}

        {/* Preview */}
        {parsedLines.length > 0 && !results && (
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3">
              Preview — {parsedLines.length} transacties gevonden
            </h3>
            <div className="overflow-x-auto border border-[var(--glass-border)] rounded-lg">
              <table className="min-w-full divide-y divide-[var(--glass-border)]">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-28">Datum</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase w-32">Bedrag</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Omschrijving</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-[var(--glass-border)]">
                  {preview.map((line, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 text-sm text-[var(--text-primary)] whitespace-nowrap">{line.date}</td>
                      <td className={`px-4 py-3 text-sm text-right whitespace-nowrap font-mono ${line.amount < 0 ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400"}`}>
                        {formatCurrency(line.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-secondary)] max-w-xs truncate">{line.description || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedLines.length > 10 && (
              <p className="text-xs text-[var(--text-secondary)] mt-2">... en {parsedLines.length - 10} meer transacties</p>
            )}

            <div className="mt-4">
              <Button
                onClick={handleImport}
                disabled={importing}
                color="blue"
                text={importing ? "Importeren..." : `${parsedLines.length} transacties importeren`}
              />
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 dark:text-green-200 mb-2">Import resultaten</h3>
              <div className="text-sm text-green-800 dark:text-green-300 space-y-1">
                <p><strong>Totaal:</strong> {results.total} transacties</p>
                <p><strong>Geïmporteerd:</strong> {results.successful}</p>
                {results.skipped > 0 && (
                  <p><strong>Overgeslagen (duplicaat):</strong> {results.skipped}</p>
                )}
                {results.failed > 0 && (
                  <p><strong>Mislukt:</strong> {results.failed}</p>
                )}
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-red-900 dark:text-red-200 mb-2">Fouten</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {results.errors.map((err, i) => (
                    <div key={i} className="text-xs text-red-800 dark:text-red-300">
                      <strong>Rij {err.row}:</strong> {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => navigate("/finance/bank-statement-lines")}
                color="blue"
                text="Ga naar bankafschriften"
              />
              <Button
                onClick={() => {
                  setParsedLines([]);
                  setResults(null);
                  setParseError(null);
                }}
                color="gray"
                text="Nieuwe import"
              />
            </div>
          </div>
        )}
      </div>
    </PageContent>
  );
};

export default BankStatementImport;
