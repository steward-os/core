import { DeleteButton } from "../../components/Button";
import { ListRow, RowButtons } from "../../components/List";

const MeetingTemplateListItem = ({ template, onEdit, onDelete }) => {
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(template);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(template.id);
  };

  return (
    <ListRow
      onClick={handleEdit}
      columns={[
        {
          content: template.name,
          width: "95%",
          className: "text-sm pr-0 pl-0 truncate",
        },
        {
          content: (
            <RowButtons center={false}>
              <DeleteButton onClick={handleDelete} />
            </RowButtons>
          ),
          width: "5%",
          className: "text-right",
        },
      ]}
    />
  );
};

export default MeetingTemplateListItem;
