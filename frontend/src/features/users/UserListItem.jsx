// UserListItem.jsx
import { DeleteButton } from "../../components/Button";
import { ListRow, RowButtons } from "../../components/List";

const UserListItem = ({ user, onDelete, onClick }) => (
  <ListRow
    key={user.id}
    onClick={onClick}
    columns={[
      {
        content: user.name || "-",
        width: "55%",
        className: "text-sm truncate",
      },
      {
        content: user.email,
        width: "35%",
        className: "text-sm truncate",
      },
      {
        content: (
          <RowButtons>
            <DeleteButton
              onClick={(e) => {
                e.stopPropagation();
                onDelete(user.id);
              }}
            />
          </RowButtons>
        ),
        width: "10%",
      },
    ]}
  />
);

export default UserListItem;
