import { DeleteButton, EditButton } from "../../components/Button";
import { ListRow, RowButtons } from "../../components/List";
import { formatDateTime } from "../../utils/dateTimeUtils";

const MeetingListItem = ({ meeting, onClick, onEdit, onDelete }) => {
  const getStatusDisplay = () => {
    if (!meeting.date_time) return "Geen datum";

    const now = new Date();
    const meetingDate = new Date(meeting.date_time);

    if (meetingDate > now) {
      return <span className="text-blue-600">Gepland</span>;
    } else {
      return <span className="text-gray-600">Afgelopen</span>;
    }
  };

  return (
    <ListRow
      onClick={onClick}
      columns={[
        {
          content: meeting.name || "Naamloze vergadering",
          width: "40%",
          className: " font-medium",
        },
        {
          content: meeting.date_time ? formatDateTime(meeting.date_time) : "Geen datum",
          width: "30%",
          className: " text-gray-600",
        },
        {
          content: getStatusDisplay(),
          width: "15%",
          className: "",
        },
        {
          content: (
            <RowButtons>
              <EditButton
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(meeting);
                }}
              />
              <DeleteButton
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(meeting.id);
                }}
              />
            </RowButtons>
          ),
          width: "15%",
        },
      ]}
    />
  );
};

export default MeetingListItem;
