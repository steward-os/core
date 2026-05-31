import { useEffect, useState } from "react";
import DetailBlock, { Label, Row, Value } from "../../components/Detail/DetailBlock";
import DetailCard from "../../components/Detail/DetailCard";
import { ListView } from "../../components/List/ListView";
import DialogPanel from "../../components/Modal/DialogPanel";
import UpdatesSection from "../../components/Remarks/UpdatesSection";
import AttachActionForm from "../actions/AttachActionForm";
import { useTagsForRelation } from "../../hooks/useRelationTagQuery";
import pb from "../../pb";
import { formatDateTime } from "../../utils/dateTimeUtils";

const EMAIL_COLUMNS = [
  { label: "Datum", width: "20%", field: "date", sortable: false, render: (e) => formatDateTime(e.date) },
  { label: "In/uit", width: "10%", field: "direction", sortable: false },
  { label: "Naam", width: "25%", field: "name", sortable: false },
  { label: "Omschrijving", width: "30%", field: "description", sortable: false },
];

/**
 * Shared relation detail content used by both RelationDetail (page) and RelationDetailModal.
 *
 * @param {Object} relation — the relation record
 * @param {string} id       — relation record ID
 */
const RelationDetailContent = ({ relation, id }) => {
  const { data: relationTags, isLoading: tagsLoading } = useTagsForRelation(id);
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);

  useEffect(() => {
    pb.collection("bs_correspondence")
      .getFullList({ filter: `relation = "${id}"`, sort: "-date" })
      .then(setEmails)
      .catch(() => {});
  }, [id]);

  const fullName = [relation.first_name, relation.last_name].filter(Boolean).join(" ") || "-";
  const fullAddress = [relation.address1, relation.address2].filter(Boolean).join(", ") || "-";

  return (
    <>
      <div className="space-y-6">
        <DetailCard title="Contactinformatie">
          <DetailBlock>
            <Row>
              <Label>Aanhef</Label>
              <Value>{relation.salutation || "-"}</Value>
            </Row>
            <Row>
              <Label>Initialen</Label>
              <Value>{relation.initials || "-"}</Value>
            </Row>
            <Row>
              <Label>Voornaam</Label>
              <Value>{relation.first_name || "-"}</Value>
            </Row>
            <Row>
              <Label>Achternaam</Label>
              <Value>{relation.last_name || "-"}</Value>
            </Row>
            <Row>
              <Label>Organisatie</Label>
              <Value>{relation.organisation || "-"}</Value>
            </Row>
            <Row>
              <Label>Lid</Label>
              <Value>{relation.is_member ? "Ja" : "Nee"}</Value>
            </Row>
            <Row>
              <Label>E-mailadres</Label>
              <Value>
                {relation.email ? (
                  <a href={`mailto:${relation.email}`} className="text-blue-600 hover:text-blue-800">
                    {relation.email}
                  </a>
                ) : (
                  "-"
                )}
              </Value>
            </Row>
            <Row>
              <Label>Telefoonnummer</Label>
              <Value>
                {relation.telephone ? (
                  <a href={`tel:${relation.telephone}`} className="text-blue-600 hover:text-blue-800">
                    {relation.telephone}
                  </a>
                ) : (
                  "-"
                )}
              </Value>
            </Row>
          </DetailBlock>

          <DetailBlock title="Adresgegevens">
            <Row>
              <Label>Adres</Label>
              <Value>{fullAddress}</Value>
            </Row>
            <Row>
              <Label>Postcode</Label>
              <Value>{relation.zip || "-"}</Value>
            </Row>
            <Row>
              <Label>Plaats</Label>
              <Value>{relation.city || "-"}</Value>
            </Row>
            <Row>
              <Label>Land</Label>
              <Value>{relation.country || "-"}</Value>
            </Row>
          </DetailBlock>

          <DetailBlock title="Betaalgegevens">
            <Row>
              <Label>Rekeninghouder</Label>
              <Value>{relation.account_holder_name || "-"}</Value>
            </Row>
            <Row>
              <Label>IBAN</Label>
              <Value>{relation.iban || "-"}</Value>
            </Row>
            <Row>
              <Label>Mandaat kenmerk</Label>
              <Value>{relation.mandate_reference || "-"}</Value>
            </Row>
          </DetailBlock>
        </DetailCard>

        <DetailCard title="Tags">
          <div>
            {tagsLoading ? (
              <span className="text-[var(--text-secondary)]">Tags laden...</span>
            ) : relationTags && relationTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {relationTags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[var(--text-secondary)]">Geen tags toegewezen</span>
            )}
          </div>
        </DetailCard>

        <DetailCard title="Correspondentie" contentClassName="">
          <div className="m-5">
            <ListView
              data={emails}
              headerColumns={EMAIL_COLUMNS}
              onClick={setSelectedEmail}
              emptyMessage="Geen correspondentie gevonden"
              className="shadow-none rounded-none"
              headerType="simple"
            />
          </div>
        </DetailCard>

        <DetailCard title="Acties" contentClassName="">
          <AttachActionForm connectionModel="bs_relations" connectionId={id} label={fullName} />
        </DetailCard>

        <DetailCard title="Updates" contentClassName="p-4">
          <UpdatesSection entityType="bs_relations" entityId={id} showCard={false} title="" />
        </DetailCard>
      </div>

      <DialogPanel
        open={!!selectedEmail}
        title={selectedEmail?.subject || "E-mail"}
        onClose={() => setSelectedEmail(null)}
      >
        {selectedEmail && (
          <div className="space-y-4">
            <DetailBlock>
              <Row>
                <Label>Datum</Label>
                <Value>{formatDateTime(selectedEmail.date)}</Value>
              </Row>
              <Row>
                <Label>Van</Label>
                <Value>{selectedEmail.from || "-"}</Value>
              </Row>
              <Row>
                <Label>Aan</Label>
                <Value>{selectedEmail.to || "-"}</Value>
              </Row>
              {selectedEmail.cc && (
                <Row>
                  <Label>CC</Label>
                  <Value>{selectedEmail.cc}</Value>
                </Row>
              )}
            </DetailBlock>
            {selectedEmail.body && (
              <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap border-t border-[var(--glass-border)] pt-4">
                {selectedEmail.body}
              </p>
            )}
          </div>
        )}
      </DialogPanel>
    </>
  );
};

export default RelationDetailContent;
