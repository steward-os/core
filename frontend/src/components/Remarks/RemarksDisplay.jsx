import { useRemarksForEntity } from "../../hooks/useRemarksQuery";
import { formatDateTime } from "../../utils/dateTimeUtils";

/**
 * Read-only remarks display for dialogs and quick views
 * @param {Object} props
 * @param {string} props.entityType - The collection name (e.g., "bs_notes", "bs_meeting_topics")
 * @param {string} props.entityId - The entity ID
 * @param {string} props.title - Section title (default: "Opmerkingen")
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.compact - Use compact styling (default: false)
 */
const RemarksDisplay = ({
  entityType,
  entityId,
  title = "Opmerkingen",
  className = "",
  compact = false
}) => {
  const { data: remarks = [], isLoading: remarksLoading } = useRemarksForEntity(entityType, entityId);

  const textSize = compact ? "text-sm" : "text-base";
  const titleSize = compact ? "text-sm" : "text-base";
  const metaSize = compact ? "text-xs" : "text-sm";
  const spacing = compact ? "space-y-1" : "space-y-2";
  const borderClass = compact ? "border-l-3 border-blue-400" : "border-l-4 border-blue-500";
  const paddingClass = compact ? "pl-3 py-1" : "pl-4 py-2";

  return (
    <div className={className}>
      <h3 className={`font-medium text-gray-900 mb-1 ${titleSize}`}>{title}</h3>
      {remarksLoading ? (
        <p className={`text-gray-500 ${textSize}`}>Opmerkingen laden...</p>
      ) : remarks.length === 0 ? (
        <p className={`text-gray-500 ${textSize}`}>Geen opmerkingen</p>
      ) : (
        <div className={spacing}>
          {remarks.map((remark) => (
            <div key={remark.id} className={`${borderClass} ${paddingClass}`}>
              <p className={`text-gray-700 whitespace-pre-wrap ${textSize}`}>{remark.update}</p>
              <p className={`text-gray-500 mt-1 ${metaSize}`}>
                {remark.expand?.author?.name || "Onbekend"} • {formatDateTime(remark.created)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RemarksDisplay;