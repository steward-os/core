import DetailBlock, { Label, Row, Value } from "../../components/Detail/DetailBlock";
import DetailCard from "../../components/Detail/DetailCard";
import UpdatesSection from "../../components/Remarks/UpdatesSection";
import TagList from "../../components/TagList";
import ActionConnectionForm from "./ActionConnectionForm";
import { formatDateTime } from "../../utils/dateTimeUtils";

const STATE_LABELS = { open: "Open", in_progress: "In uitvoering", closed: "Afgesloten" };
const STATE_COLORS = {
  open: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  closed: "bg-gray-100 text-gray-800",
};

/**
 * Shared action detail content used by both ActionDetail (page) and ActionDetailModal.
 *
 * @param {Object}  action    — the action record (with expand.assigned_to, expand.tags)
 * @param {string}  id        — action record ID
 * @param {boolean} showCards — wrap each section in a DetailCard (page mode)
 */
const ActionDetailContent = ({ action, id, showCards = false }) => {
  const tags = action.expand?.tags || [];

  const fields = (
    <DetailBlock>
      <Row>
        <Label>Status</Label>
        <Value>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATE_COLORS[action.state] || STATE_COLORS.open}`}>
            {STATE_LABELS[action.state] || action.state || "-"}
          </span>
        </Value>
      </Row>
      <Row>
        <Label>Toegewezen aan</Label>
        <Value>{action.expand?.assigned_to?.name || "-"}</Value>
      </Row>
      {action.datetime && (
        <Row>
          <Label>Datum</Label>
          <Value>{new Date(action.datetime).toLocaleDateString("nl-NL")}</Value>
        </Row>
      )}
      {action.description && (
        <Row>
          <Label>Beschrijving</Label>
          <Value>{action.description}</Value>
        </Row>
      )}
      {tags.length > 0 && (
        <Row>
          <Label>Tags</Label>
          <Value>
            <TagList tags={tags} />
          </Value>
        </Row>
      )}
      <Row>
        <Label>Aangemaakt</Label>
        <Value>{formatDateTime(action.created)}</Value>
      </Row>
      {action.updated && action.updated !== action.created && (
        <Row>
          <Label>Laatst gewijzigd</Label>
          <Value>{formatDateTime(action.updated)}</Value>
        </Row>
      )}
    </DetailBlock>
  );

  if (showCards) {
    return (
      <div className="space-y-6">
        <DetailCard title="Actiegegevens">{fields}</DetailCard>
        <DetailCard title="Koppelingen" contentClassName="">
          <ActionConnectionForm actionId={id} />
        </DetailCard>
        <DetailCard title="Opmerkingen" contentClassName="p-4">
          <UpdatesSection entityType="bs_actions" entityId={id} showCard={false} title="" />
        </DetailCard>
      </div>
    );
  }

  return (
    <>
      {fields}
      <ActionConnectionForm actionId={id} />
      <UpdatesSection entityType="bs_actions" entityId={id} showCard={false} className="mt-4" />
    </>
  );
};

export default ActionDetailContent;
