import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import SmartSearch from "../../components/List/SmartSearch";
import { useSmartUrlParams } from "../../components/List/useSmartTagFilter";
import { GROUP_TYPES } from "../../schemas/groupSchema";
import { deleteGroup, getGroups } from "../../services/groupService";

const getTypeLabel = (value) => GROUP_TYPES.find((t) => t.value === value)?.label || value;

const getHeaderColumns = () => [
  {
    label: "Naam",
    width: "40%",
    field: "name",
    sortable: true,
    mobilePosition: "title",
  },
  {
    label: "Type",
    width: "30%",
    field: "type",
    sortable: true,
    render: (item) => getTypeLabel(item.type),
    mobilePosition: "info",
  },
  {},
];

const GroupList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField] = useState("created");
  const [sortDirection] = useState("desc");
  const { textCondition } = useSmartUrlParams();

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const options = { sort: "-created" };
      if (textCondition) options.filter = textCondition;
      const result = await getGroups(options);
      setGroups(result);
    } catch (error) {
      console.error("Error fetching groups:", error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [textCondition]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id) => {
    if (!window.confirm("Weet je zeker dat je deze groep wilt verwijderen?")) {
      return false;
    }

    try {
      await deleteGroup(id);
      fetchGroups();
      return true;
    } catch (error) {
      console.error("Error deleting group:", error);
      alert("Er is een fout opgetreden bij het verwijderen van de groep.");
      return false;
    }
  };

  const headerColumns = getHeaderColumns();

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          <AddButton onClick={() => navigate(`/groups/new?${searchParams.toString()}`)} ariaLabel="Nieuwe groep" />
        }
      >
        Groepen
      </ListHeading>
      <SmartSearch searchFields={["name"]} placeholder="Zoek op naam..." />

      {loading && <CenteredAlert text="Laden..." />}
      {!loading && (
        <ListView
          data={groups}
          totalItems={groups.length}
          headerColumns={headerColumns}
          filters={{}}
          initialSortField={sortField}
          initialSortDirection={sortDirection}
          emptyMessage="Geen groepen gevonden."
          onClick={(item) => navigate(`/groups/${item.id}?${searchParams.toString()}`)}
          onEdit={(item) => navigate(`/groups/${item.id}/edit?${searchParams.toString()}`)}
          onDelete={handleDelete}
          onSortChange={() => {}}
          onFilterChange={() => {}}
        />
      )}
    </ListContainer>
  );
};

export default GroupList;
