import { PaperClipIcon, PencilIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BackButton } from "../../components/Button/BackButton";
import { DeleteButton } from "../../components/Button/DeleteButton";
import CenteredAlert from "../../components/CenteredAlert";
import CenteredSpinner from "../../components/CenteredSpinner";
import DetailBlock, { Label, Row, Value } from "../../components/Detail/DetailBlock";
import DetailCard from "../../components/Detail/DetailCard";
import FormFieldSelectAjax from "../../components/Form/FormFieldSelectAjax";
import CorrespondenceFormFields, { formDataFromRecord } from "./CorrespondenceFormFields";
import PageContent from "../../components/Page/PageContent";
import PageHeader from "../../components/Page/PageHeader";
import { useDeleteEmail, useEmail, useUpdateEmail } from "../../hooks/crudResourceHooks";
import { useTagsForEmail } from "../../hooks/useRelationTagQuery";
import pb from "../../pb";

const IFRAME_STYLES = `
  body { margin: 0; font-family: sans-serif; }
`;

function CorrespondenceBody({ html }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head>
      <style>${IFRAME_STYLES}</style>
    </head><body>${html}</body></html>`);
    doc.close();

    const resize = () => {
      const contentWidth = doc.documentElement.scrollWidth;
      iframe.style.width = contentWidth + "px";
      iframe.style.height = doc.documentElement.scrollHeight + "px";
    };
    resize();
    iframe.contentWindow.addEventListener("load", resize);
    return () => iframe.contentWindow?.removeEventListener("load", resize);
  }, [html]);

  return (
    <div className="overflow-x-auto">
      <iframe ref={iframeRef} className="border-0" title="email body" />
    </div>
  );
}

const CorrespondenceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const deleteEmailMutation = useDeleteEmail();
  const updateEmailMutation = useUpdateEmail();

  const { data: email, isLoading, error } = useEmail(id);
  const { data: emailTags } = useTagsForEmail(id);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ description: "", topic: "", relation: "", direction: "in", type: "email" });

  const startEdit = () => {
    setFormData({
      ...formDataFromRecord(email),
      relation: email.relation || "",
    });
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const handleSave = async () => {
    try {
      await updateEmailMutation.mutateAsync({ id, data: formData });
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating email:", err);
      alert("Er is een fout opgetreden bij het opslaan.");
    }
  };

  const handleCreateRelation = async (name) => {
    const parts = name.trim().split(/\s+/);
    const first_name = parts[0];
    const last_name = parts.slice(1).join(" ");
    const fromEmail = (email.from?.match(/<([^>]+)>/) || [])[1] || email.from || "";
    const record = await pb.collection("bs_relations").create({ first_name, last_name, email: fromEmail });
    return record;
  };

  const handleDelete = async () => {
    if (!window.confirm("Weet je zeker dat je deze e-mail wilt verwijderen?")) return;
    try {
      await deleteEmailMutation.mutateAsync(id);
      navigate(-1);
    } catch (err) {
      console.error("Error deleting email:", err);
      alert("Er is een fout opgetreden bij het verwijderen van de e-mail.");
    }
  };

  if (isLoading) return <CenteredSpinner />;
  if (error) return <CenteredAlert text={`Fout bij laden: ${error.message}`} />;
  if (!email) return <CenteredAlert text="E-mail niet gevonden." />;

  return (
    <PageContent fullWidth>
      <PageHeader
        title={email.description || email.subject || "Geen onderwerp"}
        backButton={<BackButton onClick={() => navigate(-1)} ariaLabel="Terug naar post" />}
      >
        <DeleteButton onClick={handleDelete} showText size="normal" ariaLabel="E-mail verwijderen" />
      </PageHeader>

      <div className="space-y-6">
        <DetailCard title="E-mailvelden">
          <DetailBlock>
            <Row>
              <Label>Van</Label>
              <Value>{email.from || "-"}</Value>
            </Row>
            {email.to && (
              <Row>
                <Label>Aan</Label>
                <Value>{email.to}</Value>
              </Row>
            )}
            {email.cc && (
              <Row>
                <Label>CC</Label>
                <Value>{email.cc}</Value>
              </Row>
            )}
            <Row>
              <Label>Onderwerp</Label>
              <Value>{email.subject || "-"}</Value>
            </Row>
          </DetailBlock>
        </DetailCard>

        <DetailCard
          title="Kenmerken"
          action={
            !isEditing && (
              <button
                type="button"
                onClick={startEdit}
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
              >
                <PencilIcon className="w-4 h-4" />
                <span>Bewerken</span>
              </button>
            )
          }
        >
          {isEditing ? (
            <div className="p-4 space-y-4">
              <CorrespondenceFormFields formData={formData} setFormData={setFormData} email={email} />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relatie</label>
                <FormFieldSelectAjax
                  name="relation"
                  collection="bs_relations"
                  searchFields={["organisation", "first_name", "last_name"]}
                  query={{ sort: "last_name,first_name" }}
                  optionDisplay={(r) =>
                    (r.organisation ? r.organisation + ": " : "") +
                      [r.first_name, r.last_name].filter(Boolean).join(" ") ||
                    r.email ||
                    r.id
                  }
                  formData={formData}
                  setFormData={setFormData}
                  placeholder="Zoek een relatie..."
                  create={handleCreateRelation}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={updateEmailMutation.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {updateEmailMutation.isPending ? "Opslaan..." : "Opslaan"}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuleren
                </button>
              </div>
            </div>
          ) : (
            <DetailBlock>
              <Row>
                <Label>Datum</Label>
                <Value>{email.date ? email.date.substring(0, 10) : "-"}</Value>
              </Row>
              <Row>
                <Label>In/uit</Label>
                <Value>{email.direction == "in" ? "Inkomend" : email.direction == "uit" ? "Uitgaand" : "-"}</Value>
              </Row>
              <Row>
                <Label>Type</Label>
                <Value>{email.type || "-"}</Value>
              </Row>
              <Row>
                <Label>Naam</Label>
                <Value>{email.name || "-"}</Value>
              </Row>
              <Row>
                <Label>Discussie</Label>
                <Value>{email.expand?.topic?.title || "-"}</Value>
              </Row>
              <Row>
                <Label>Omschrijving</Label>
                <Value>{email.description || "-"}</Value>
              </Row>
              <Row>
                <Label>Relatie</Label>
                <Value>
                  {email.expand?.relation
                    ? (email.expand.relation.organisation ? email.expand.relation.organisation + ": " : "") +
                      [email.expand.relation.first_name, email.expand.relation.last_name].filter(Boolean).join(" ")
                    : "-"}
                </Value>
              </Row>
              <Row>
                <Label>Tags</Label>
                <Value>
                  {emailTags?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {emailTags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: tag.color || "#3B82F6" }}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "-"
                  )}
                </Value>
              </Row>
            </DetailBlock>
          )}
        </DetailCard>

        {email.body && (
          <DetailCard title="Inhoud" contentClassName="bg-white p-4">
            <CorrespondenceBody html={email.body} />
          </DetailCard>
        )}

        {email.attachments?.length > 0 && (
          <DetailCard title="Bijlagen">
            <div className="divide-y divide-[var(--glass-border)]">
              {email.attachments.map((filename) => {
                const url = pb.files.getURL(email, filename);
                const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
                const isPdf = /\.pdf$/i.test(filename);
                return (
                  <div key={filename}>
                    {isImage && (
                      <img src={url} alt={filename} className="w-full" />
                    )}
                    {isPdf && (
                      <iframe src={url} title={filename} className="w-full border-0" style={{ height: "600px" }} />
                    )}
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <PaperClipIcon className="w-4 h-4 flex-shrink-0" />
                      {filename}
                    </a>
                  </div>
                );
              })}
            </div>
          </DetailCard>
        )}
      </div>
    </PageContent>
  );
};

export default CorrespondenceDetail;
