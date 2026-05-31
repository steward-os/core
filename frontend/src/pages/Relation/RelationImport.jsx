import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { read, utils } from "xlsx";
import posthog from "../../posthog";
import { BackButton } from "../../components/Button/BackButton";
import { Button } from "../../components/Button/Button";
import PageHeader from "../../components/Page/PageHeader";
import PageContent from "../../components/Page/PageContent";
import CenteredAlert from "../../components/CenteredAlert";
import { useBulkCreateRelations } from "../../hooks/crudResourceHooks";

const EXPECTED_COLUMNS = [
  { field: "salutation", label: "Aanhef", required: false },
  { field: "initials", label: "Initialen", required: false },
  { field: "first_name", label: "Voornaam", required: false },
  { field: "last_name", label: "Achternaam", required: false },
  { field: "organisation", label: "Organisatie", required: false },
  { field: "email", label: "E-mailadres", required: false },
  { field: "telephone", label: "Telefoonnummer", required: false },
  { field: "address1", label: "Adres 1", required: false },
  { field: "address2", label: "Adres 2", required: false },
  { field: "city", label: "Plaats", required: false },
  { field: "zip", label: "Postcode", required: false },
  { field: "country", label: "Land", required: false },
  { field: "tags", label: "Tags (komma-gescheiden)", required: false },
];

const RelationImport = () => {
  const navigate = useNavigate();
  const bulkCreateMutation = useBulkCreateRelations();

  const [, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [preview, setPreview] = useState([]);
  const [columns, setColumns] = useState([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) return;

    try {
      setFile(selectedFile);
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = read(arrayBuffer, { type: "buffer" });

      // Use first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON with header row as keys
      const jsonData = utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        alert("Het Excel bestand moet minimaal een header rij en een data rij bevatten.");
        return;
      }

      // Get headers and data
      const headers = jsonData[0];
      const rows = jsonData.slice(1);

      // Convert to objects
      const parsedData = rows.map((row) => {
        const obj = {};
        headers.forEach((header, index) => {
          if (header && row[index] !== undefined) {
            obj[header] = row[index];
          }
        });
        return obj;
      });

      setColumns(headers);
      setData(parsedData);
      setPreview(parsedData.slice(0, 5)); // Show first 5 rows for preview
      setResults(null);
    } catch (error) {
      console.error("Error reading Excel file:", error);
      alert("Fout bij het lezen van het Excel bestand. Controleer of het een geldig .xlsx bestand is.");
    }
  };

  const handleImport = async () => {
    if (!data.length) {
      alert("Geen data om te importeren.");
      return;
    }

    setImporting(true);
    try {
      const results = await bulkCreateMutation.mutateAsync(data);
      posthog.capture("relations imported", {
        total: results.total,
        successful: results.successful,
        failed: results.failed,
      });
      setResults(results);
    } catch (error) {
      console.error("Import error:", error);
      posthog.captureException(error);
      alert("Er is een fout opgetreden tijdens de import.");
    }
    setImporting(false);
  };

  const handleDownloadTemplate = () => {
    // Create template data
    const templateData = [
      EXPECTED_COLUMNS.map((col) => col.label),
      EXPECTED_COLUMNS.map((col) => col.field),
      // Add example row
      [
        "Dhr.",
        "J.A.",
        "Jan",
        "Janssen",
        "ABC Bedrijf B.V.",
        "jan.janssen@example.com",
        "06-12345678",
        "Hoofdstraat 1",
        "",
        "Amsterdam",
        "1000AA",
        "Nederland",
        "VIP, Sponsor",
      ],
    ];

    const worksheet = utils.aoa_to_sheet(templateData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Relaties Template");

    // Download
    const excelBuffer = utils.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "relaties-template.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageContent>
      <PageHeader
        title="Relaties importeren"
        backButton={<BackButton onClick={() => navigate("/relations")} ariaLabel="Terug naar relaties" />}
      />

      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">Instructies</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Upload een Excel (.xlsx) bestand met relaties</li>
            <li>• De eerste rij moet kolomnamen bevatten die overeenkomen met de veldnamen</li>
            <li>• Minimaal een voor- of achternaam is vereist per relatie</li>
            <li>• Tags kunnen worden opgegeven in een "tags" kolom, gescheiden door komma's</li>
            <li>• Nieuwe tags worden automatisch aangemaakt indien niet bestaand</li>
            <li>• Download de template voor het juiste formaat</li>
          </ul>
        </div>

        {/* Template download */}
        <div>
          <Button onClick={handleDownloadTemplate} color="gray" text="Download Excel Template" className="mb-4" />
        </div>

        {/* Expected columns */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Verwachte kolommen</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            {EXPECTED_COLUMNS.map((col) => (
              <div key={col.field} className="bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                <span className="font-medium dark:text-gray-200">{col.label}</span>
                <span className="text-gray-500 dark:text-gray-400"> ({col.field})</span>
              </div>
            ))}
          </div>
        </div>

        {/* File upload */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Excel bestand selecteren</h3>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Preview ({data.length} relaties gevonden)</h3>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {columns.map((col, index) => (
                      <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.map((row, index) => (
                    <tr key={index}>
                      {columns.map((col, colIndex) => (
                        <td key={colIndex} className="px-4 py-3 text-sm text-gray-900">
                          {row[col] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.length > 5 && <p className="text-sm text-gray-500 mt-2">... en {data.length - 5} meer relaties</p>}
          </div>
        )}

        {/* Import button */}
        {data.length > 0 && !results && (
          <div>
            <Button
              onClick={handleImport}
              disabled={importing}
              color="blue"
              text={importing ? "Importeren..." : `${data.length} relaties importeren`}
              className="w-full justify-center"
            />
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-green-900 mb-2">Import resultaten</h3>
              <div className="text-sm text-green-800">
                <p>
                  <strong>Totaal:</strong> {results.total} relaties
                </p>
                <p>
                  <strong>Succesvol:</strong> {results.successful} relaties
                </p>
                <p>
                  <strong>Gefaald:</strong> {results.failed} relaties
                </p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-md font-medium text-red-900 mb-2">Fouten</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {results.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-800">
                      <strong>Rij {error.row}:</strong> {error.error}
                      <div className="text-xs text-red-600 ml-2">{JSON.stringify(error.data)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => navigate("/relations")}
                color="blue"
                text="Ga naar relaties"
                className="w-full md:w-auto md:min-w-[160px] justify-center"
              />
              <Button
                onClick={() => window.location.reload()}
                color="gray"
                text="Nieuwe import"
                className="w-full md:w-auto md:min-w-[160px] justify-center"
              />
            </div>
          </div>
        )}
      </div>
    </PageContent>
  );
};

export default RelationImport;
