import { EyeIcon, EyeSlashIcon, LinkIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import Input from "../../components/Form/Input";
import Label from "../../components/Form/Label";

const LOCAL_STORAGE_PREFIX = "enc_key_";

function loadKeys() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k.startsWith(LOCAL_STORAGE_PREFIX)) {
      keys.push({ name: k.slice(LOCAL_STORAGE_PREFIX.length), value: localStorage.getItem(k) });
    }
  }
  return keys;
}

function buildShareUrl(name, value) {
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify({ name, value }))));
  const base = window.location.origin + window.location.pathname;
  return base + "#sleutel:" + payload;
}

function parseShareHash(hash) {
  if (!hash.startsWith("#sleutel:")) return null;
  try {
    const payload = hash.slice("#sleutel:".length);
    return JSON.parse(decodeURIComponent(escape(atob(payload))));
  } catch {
    return null;
  }
}

export default function EncryptionKeys() {
  const [keys, setKeys] = useState(loadKeys);
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState("");
  const [visible, setVisible] = useState({});
  const [copied, setCopied] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);

  useEffect(() => {
    const parsed = parseShareHash(window.location.hash);
    if (parsed?.name && parsed?.value) {
      setPendingImport(parsed);
      history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  const handleImport = () => {
    localStorage.setItem(LOCAL_STORAGE_PREFIX + pendingImport.name, pendingImport.value);
    setPendingImport(null);
    refresh();
  };

  const refresh = () => setKeys(loadKeys());

  const handleShare = async (key) => {
    const url = buildShareUrl(key.name, key.value);
    await navigator.clipboard.writeText(url);
    setCopied(key.name);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) {
      setError("Naam is verplicht.");
      return;
    }
    if (!newValue.trim()) {
      setError("Sleutelwaarde is verplicht.");
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_PREFIX + trimmedName, newValue.trim());
    setNewName("");
    setNewValue("");
    setError("");
    refresh();
  };

  const handleDelete = (name) => {
    if (!window.confirm(`Wil je de sleutel "${name}" verwijderen?`)) return;
    localStorage.removeItem(LOCAL_STORAGE_PREFIX + name);
    refresh();
  };

  const toggleVisible = (name) => setVisible((v) => ({ ...v, [name]: !v[name] }));

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Sleutels</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-6">
        Op deze pagina beheer je de sleutels die toegang geven tot de gegevens binnen jouw rollen. Voor maximale
        veiligheid werken wij volgens het 'Zero-Knowledge' principe: de gedeelde sleutels om deze data te lezen en te
        schrijven staan alleen lokaal in je browser. Ze worden nooit naar onze server gestuurd.
      </p>

      {/* Import from link banner */}
      {pendingImport && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl px-4 py-4">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">Sleutel via link ontvangen</p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            Wil je de sleutel <span className="font-mono font-semibold">{pendingImport.name}</span> opslaan?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleImport}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Opslaan
            </button>
            <button
              onClick={() => setPendingImport(null)}
              className="px-3 py-1.5 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/30 text-sm font-medium rounded-lg transition-colors"
            >
              Negeren
            </button>
          </div>
        </div>
      )}

      {/* Stored keys */}
      {keys.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)] mb-6">Geen sleutels opgeslagen.</p>
      ) : (
        <div className="mb-6 space-y-2">
          {keys.map((key) => (
            <div
              key={key.name}
              className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{key.name}</p>
                <p className="text-xs text-[var(--text-secondary)] font-mono truncate mt-0.5">
                  {visible[key.name] ? key.value : "••••••••••••••••"}
                </p>
              </div>
              <button
                onClick={() => handleShare(key)}
                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                title={copied === key.name ? "Gekopieerd!" : "Deel via link"}
              >
                {copied === key.name ? (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Gekopieerd!</span>
                ) : (
                  <LinkIcon className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => toggleVisible(key.name)}
                className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                title={visible[key.name] ? "Verbergen" : "Tonen"}
              >
                {visible[key.name] ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleDelete(key.name)}
                className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Verwijderen"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new key */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Nieuwe sleutel toevoegen</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <Label htmlFor="key-name">Naam</Label>
            <Input
              id="key-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="bijv. bestuur"
            />
          </div>
          <div>
            <Label htmlFor="key-value">Sleutelwaarde</Label>
            <Input
              id="key-value"
              type="password"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Plak hier de sleutel"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Opslaan
          </button>
        </form>
      </div>
    </div>
  );
}
