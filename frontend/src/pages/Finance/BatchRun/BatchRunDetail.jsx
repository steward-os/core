import { useNavigate, useParams } from "react-router-dom";
import { BackButton } from "../../../components/Button/BackButton";
import { DeleteButton } from "../../../components/Button/DeleteButton";
import { EditButton } from "../../../components/Button/EditButton";
import CenteredAlert from "../../../components/CenteredAlert";
import CenteredSpinner from "../../../components/CenteredSpinner";
import DetailBlock, { Label, Row, Value } from "../../../components/Detail/DetailBlock";
import DetailCard from "../../../components/Detail/DetailCard";
import PageContent from "../../../components/Page/PageContent";
import PageHeader from "../../../components/Page/PageHeader";
import { useBatchRun, useDeleteBatchRun } from "../../../hooks/crudResourceHooks";
import pb from "../../../pb";

const STATUS_LABELS = {
  DRAFT: "Concept",
  PROCESSING: "Verwerking",
  COMPLETED: "Voltooid",
  FAILED: "Mislukt",
};

const STATUS_COLORS = {
  DRAFT: "bg-gray-100 text-gray-700",
  PROCESSING: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

const BatchRunDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const deleteMutation = useDeleteBatchRun();

  const { data: batchRun, isLoading, error } = useBatchRun(id);

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je deze batchrun wilt verwijderen?")) return;
    try {
      await deleteMutation.mutateAsync(id);
      navigate("/finance/batch-runs");
    } catch (err) {
      console.error("Error deleting batch run:", err);
      alert("Er is een fout opgetreden bij het verwijderen.");
    }
  };

  if (isLoading) return <CenteredSpinner />;
  if (error) return <CenteredAlert text={`Fout bij laden: ${error.message}`} />;
  if (!batchRun) return <CenteredAlert text="Batchrun niet gevonden." />;

  const statusLabel = STATUS_LABELS[batchRun.status] || batchRun.status || "-";
  const statusColor = STATUS_COLORS[batchRun.status] || "bg-gray-100 text-gray-700";

  const formattedDate = batchRun.run_date
    ? new Date(batchRun.run_date).toLocaleDateString("nl-NL")
    : "-";

  const formattedAmount =
    batchRun.total_amount != null
      ? new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(batchRun.total_amount)
      : "-";

  return (
    <PageContent>
      <PageHeader
        title={batchRun.description || "Batchrun"}
        backButton={
          <BackButton
            onClick={() => navigate("/finance/batch-runs")}
            ariaLabel="Terug naar batchruns"
          />
        }
      >
        <EditButton
          onClick={() => navigate(`/finance/batch-runs/${id}/edit`)}
          showText
          size="normal"
          ariaLabel="Batchrun bewerken"
        />
        <DeleteButton
          onClick={handleDelete}
          showText
          size="normal"
          ariaLabel="Batchrun verwijderen"
        />
      </PageHeader>

      <div className="space-y-6">
        <DetailCard title="Details">
          <DetailBlock>
            <Row>
              <Label>Datum</Label>
              <Value>{formattedDate}</Value>
            </Row>
            <Row>
              <Label>Omschrijving</Label>
              <Value>{batchRun.description || "-"}</Value>
            </Row>
            <Row>
              <Label>Type</Label>
              <Value>{batchRun.type || "-"}</Value>
            </Row>
            <Row>
              <Label>Status</Label>
              <Value>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}
                >
                  {statusLabel}
                </span>
              </Value>
            </Row>
            <Row>
              <Label>Totaalbedrag</Label>
              <Value>{formattedAmount}</Value>
            </Row>
            {batchRun.sepa_file && (
              <Row>
                <Label>SEPA bestand</Label>
                <Value>
                  <a
                    href={pb.files.getURL(batchRun, batchRun.sepa_file)}
                    download={batchRun.sepa_file}
                    className="text-blue-600 hover:text-blue-800 underline text-sm"
                  >
                    {batchRun.sepa_file}
                  </a>
                </Value>
              </Row>
            )}
          </DetailBlock>
        </DetailCard>
      </div>
    </PageContent>
  );
};

export default BatchRunDetail;
