import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Label from "../../../components/Form/Label";
import Select from "../../../components/Form/Select";
import PageContent from "../../../components/Page/PageContent";
import PageHeader from "../../../components/Page/PageHeader";
import pb from "../../../pb";
import { decryptValue, encryptValue, isEncrypted, loadLocalStorageKeys } from "../../../utils/cryptoUtils";

function KeySelect({ id, label, value, onChange, includeEmpty, emptyLabel }) {
  const keys = loadLocalStorageKeys();

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {includeEmpty && <option value="">{emptyLabel || "— geen —"}</option>}
        {keys.map((k) => (
          <option key={k.name} value={k.name}>{k.name}</option>
        ))}
      </Select>
      {keys.length === 0 && (
        <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
          Geen sleutels gevonden. Voeg eerst sleutels toe via Mijn account → Sleutels.
        </p>
      )}
    </div>
  );
}

function StatusRow({ record, label: rowLabel, status }) {
  const color =
    status === "ok" ? "text-green-600 dark:text-green-400" :
    status === "error" ? "text-red-500" :
    status === "running" ? "text-blue-500" :
    "text-[var(--text-secondary)]";

  const statusLabel =
    status === "ok" ? "Opgeslagen" :
    status === "error" ? "Fout" :
    status === "running" ? "Bezig..." :
    "Wacht...";

  return (
    <div className="flex items-center gap-3 px-4 py-2 text-sm">
      <span className="flex-1 text-[var(--text-primary)] font-mono truncate">{record.id}</span>
      <span className="w-48 truncate text-[var(--text-secondary)]">{rowLabel}</span>
      <span className={`w-24 text-right ${color}`}>{statusLabel}</span>
    </div>
  );
}

export default function EncryptiePage() {
  const [readKeyName, setReadKeyName] = useState("");
  const [writeKeyName, setWriteKeyName] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const [notesReadKeyName, setNotesReadKeyName] = useState("");
  const [notesWriteKeyName, setNotesWriteKeyName] = useState("");
  const [notesRunning, setNotesRunning] = useState(false);
  const [notesResults, setNotesResults] = useState(null);
  const [notesError, setNotesError] = useState("");

  const queryClient = useQueryClient();

  const getKeyValue = (name) => {
    if (!name) return null;
    return localStorage.getItem("enc_key_" + name);
  };

  const handleRun = async () => {
    setError("");
    setResults(null);

    setRunning(true);
    let records;
    try {
      records = await pb.collection("bs_relations").getFullList({ filter: 'iban != ""', sort: "last_name,first_name" });
    } catch (e) {
      setError("Fout bij ophalen van relaties: " + e.message);
      setRunning(false);
      return;
    }

    const rows = records.map((r) => ({ record: r, status: "pending" }));
    setResults([...rows]);

    const readKey = getKeyValue(readKeyName);
    const writeKey = getKeyValue(writeKeyName);

    for (let i = 0; i < rows.length; i++) {
      rows[i] = { ...rows[i], status: "running" };
      setResults([...rows]);

      try {
        const rawIban = rows[i].record.iban;
        let plainIban;

        if (!rawIban) {
          rows[i] = { ...rows[i], status: "ok" };
          setResults([...rows]);
          continue;
        }

        if (readKey && isEncrypted(rawIban)) {
          plainIban = await decryptValue(rawIban, readKey);
        } else {
          plainIban = rawIban;
        }

        const savedIban = writeKey ? await encryptValue(plainIban, writeKeyName, writeKey) : plainIban;
        await pb.collection("bs_relations").update(rows[i].record.id, { iban: savedIban });
        rows[i] = { ...rows[i], status: "ok" };
      } catch (e) {
        rows[i] = { ...rows[i], status: "error", message: e.message };
      }

      setResults([...rows]);
    }

    setRunning(false);
    queryClient.invalidateQueries();
  };

  const handleRunNotes = async () => {
    setNotesError("");
    setNotesResults(null);
    setNotesRunning(true);

    let records;
    try {
      records = await pb.collection("bs_notes").getFullList({ sort: "created" });
    } catch (e) {
      setNotesError("Fout bij ophalen van notities: " + e.message);
      setNotesRunning(false);
      return;
    }

    const rows = records.map((r) => ({ record: r, status: "pending" }));
    setNotesResults([...rows]);

    const readKey = getKeyValue(notesReadKeyName);
    const writeKey = getKeyValue(notesWriteKeyName);

    for (let i = 0; i < rows.length; i++) {
      rows[i] = { ...rows[i], status: "running" };
      setNotesResults([...rows]);

      try {
        const rawName = rows[i].record.name;

        if (!rawName) {
          rows[i] = { ...rows[i], status: "ok" };
          setNotesResults([...rows]);
          continue;
        }

        let plainName;
        if (readKey && isEncrypted(rawName)) {
          plainName = await decryptValue(rawName, readKey);
        } else {
          plainName = rawName;
        }

        const savedName = writeKey ? await encryptValue(plainName, notesWriteKeyName, writeKey) : plainName;
        await pb.collection("bs_notes").update(rows[i].record.id, { name: savedName });
        rows[i] = { ...rows[i], status: "ok" };
      } catch (e) {
        rows[i] = { ...rows[i], status: "error", message: e.message };
      }

      setNotesResults([...rows]);
    }

    setNotesRunning(false);
    queryClient.invalidateQueries();
  };

  const doneCount = results ? results.filter((r) => r.status === "ok").length : 0;
  const errorCount = results ? results.filter((r) => r.status === "error").length : 0;
  const notesDoneCount = notesResults ? notesResults.filter((r) => r.status === "ok").length : 0;
  const notesErrorCount = notesResults ? notesResults.filter((r) => r.status === "error").length : 0;

  return (
    <>
      <PageHeader title="Encryptie" />
      <PageContent>
        {/* Encrypt IBAN section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mb-6">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Encrypt IBAN</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Alle relaties met een IBAN worden gelezen, eventueel ontsleuteld en opnieuw versleuteld opgeslagen.
            </p>
          </div>

          <div className="px-5 py-4 space-y-4">
            <KeySelect
              id="read-key"
              label="Lees sleutel voor iban"
              value={readKeyName}
              onChange={setReadKeyName}
              includeEmpty
              emptyLabel="— onversleuteld lezen —"
            />
            <KeySelect
              id="write-key"
              label="Opnieuw versleutelen met sleutel"
              value={writeKeyName}
              onChange={setWriteKeyName}
              includeEmpty
              emptyLabel="— onversleuteld opslaan —"
            />

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              onClick={handleRun}
              disabled={running}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {running ? "Bezig..." : "Versleutelen uitvoeren"}
            </button>
          </div>
        </div>

        {/* Encrypt Notes section */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mb-6">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Encrypt notities</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Alle notities worden gelezen, eventueel ontsleuteld en opnieuw versleuteld opgeslagen.
            </p>
          </div>

          <div className="px-5 py-4 space-y-4">
            <KeySelect
              id="notes-read-key"
              label="Lees sleutel voor notities"
              value={notesReadKeyName}
              onChange={setNotesReadKeyName}
              includeEmpty
              emptyLabel="— onversleuteld lezen —"
            />
            <KeySelect
              id="notes-write-key"
              label="Opnieuw versleutelen met sleutel"
              value={notesWriteKeyName}
              onChange={setNotesWriteKeyName}
              includeEmpty
              emptyLabel="— onversleuteld opslaan —"
            />

            {notesError && (
              <p className="text-sm text-red-500">{notesError}</p>
            )}

            <button
              onClick={handleRunNotes}
              disabled={notesRunning}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              {notesRunning ? "Bezig..." : "Versleutelen uitvoeren"}
            </button>
          </div>
        </div>

        {/* Notes Results */}
        {notesResults && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mb-6">
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Resultaat notities</h2>
              <span className="text-xs text-[var(--text-secondary)]">
                {notesDoneCount} ok · {notesErrorCount} fout · {notesResults.length} totaal
              </span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {notesResults.map((row) => (
                <StatusRow key={row.record.id} record={row.record} label={row.record.name} status={row.status} />
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Resultaat</h2>
              <span className="text-xs text-[var(--text-secondary)]">
                {doneCount} ok · {errorCount} fout · {results.length} totaal
              </span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {results.map((row) => (
                <StatusRow key={row.record.id} record={row.record} label={`${row.record.first_name} ${row.record.last_name}`} status={row.status} />
              ))}
            </div>
          </div>
        )}
      </PageContent>
    </>
  );
}
