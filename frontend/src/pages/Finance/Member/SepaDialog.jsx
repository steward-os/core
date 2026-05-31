import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Button } from "../../../components/Button/Button";
import Input from "../../../components/Form/Input";
import DialogPanel from "../../../components/Modal/DialogPanel";
import pb from "../../../pb";
import { decryptList } from "../../../utils/cryptoUtils";
import { generateSepaSdd } from "../../../utils/sepaGenerator";

const SepaDialog = ({ open, onClose, selectedIds }) => {
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState({});
  const [formData, setFormData] = useState({
    amount: "25.00",
    date: dayjs().add(7, "day").format("YYYY-MM-DD"),
    description: `Contributie ${dayjs().format("YYYY")}`,
  });
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      fetchParams();
      setDownloadUrl(null);
      setError(null);
    }
  }, [open]);

  const fetchParams = async () => {
    try {
      const records = await pb.collection("parameters").getFullList({
        filter: 'name ~ "sepa_"',
      });
      const p = {};
      records.forEach((r) => {
        p[r.name] = r.value;
      });
      setParams(p);
    } catch (err) {
      console.error("Error fetching SEPA parameters:", err);
      setError("Fout bij het laden van SEPA instellingen. Controleer de parameters.");
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Validate parameters
      if (!params.sepa_creditor_id || !params.sepa_iban || !params.sepa_organisation_name) {
        throw new Error("SEPA instellingen (Creditor ID, IBAN, Organisatie naam) ontbreken in parameters.");
      }

      // 2. Fetch selected members full data
      const filter = selectedIds.map((id) => `id="${id}"`).join(" || ");
      const rawMembers = await pb.collection("bs_relations").getFullList({
        filter: filter,
      });
      const members = await decryptList(rawMembers);

      // 3. Prepare data for generator
      const creditor = {
        name: params.sepa_organisation_name,
        iban: params.sepa_iban,
        id: params.sepa_creditor_id,
        bic: params.sepa_bic || "",
      };

      const payment = {
        id: `SDD-${dayjs().format("YYYYMMDD-HHmmss")}`,
        date: formData.date,
        description: formData.description,
      };

      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Ongeldig bedrag.");
      }

      const debtors = members
        .filter((m) => m.iban && m.mandate_reference)
        .map((m) => ({
          name: m.account_holder_name || `${m.first_name} ${m.last_name}`,
          iban: m.iban,
          mandateId: m.mandate_reference,
          amount: amount,
        }));

      if (debtors.length === 0) {
        throw new Error("Geen van de geselecteerde leden heeft een geldig IBAN en Mandaat kenmerk.");
      }

      if (debtors.length < members.length) {
        const skipped = members.length - debtors.length;
        alert(`Let op: ${skipped} lid/leden zijn overgeslagen omdat IBAN of Mandaat kenmerk ontbreekt.`);
      }

      // 4. Generate XML
      const xml = generateSepaSdd(creditor, payment, debtors);

      // 5. Create download link
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (err) {
      console.error("Error generating SEPA file:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogPanel open={open} onClose={onClose} title="SEPA Bestand Aanmaken">
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-secondary)]">
          Maak een SEPA incassobestand voor {selectedIds.length} geselecteerde leden.
        </p>

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>}

        {!downloadUrl ? (
          <>
            <div className="space-y-4 pt-2">
              <Input
                label="Bedrag per lid (€)"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
              <Input
                label="Incassodatum"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
              <Input
                label="Omschrijving"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button color="gray" onClick={onClose} text="Annuleren" />
              <Button color="blue" onClick={handleGenerate} loading={loading} disabled={loading} text="Maak bestand" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-6 space-y-4 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-10 h-10"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Bestand is gereed!</h3>
              <p className="text-sm text-gray-500">Klik op de knop hieronder om het SEPA bestand te downloaden.</p>
            </div>
            <a
              href={downloadUrl}
              download={`SEPA-SDD-${dayjs().format("YYYY-MM-DD")}.xml`}
              className="w-full"
              onClick={() => setTimeout(onClose, 1000)}
            >
              <Button color="green" text="Download SEPA Bestand" className="w-full justify-center" />
            </a>
            <Button color="gray" onClick={onClose} text="Sluiten" variant="ghost" />
          </div>
        )}
      </div>
    </DialogPanel>
  );
};

export default SepaDialog;
