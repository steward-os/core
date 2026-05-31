import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import SmartSearch from "../../components/List/SmartSearch";
import { useSmartTagFilter } from "../../components/List/useSmartTagFilter";
import { useDeleteUserWithConfirm, useUsers } from "../../hooks/crudResourceHooks";

const HEADER_COLUMNS = [
  {
    label: "Naam",
    width: "30%",
    field: "name",
    sortable: true,
    filter: "name",
    mobilePosition: "title",
  },
  {
    label: "E-mail",
    width: "30%",
    field: "email",
    sortable: true,
    filter: "email",
    mobilePosition: "info",
  },
  {
    label: "Groep lidmaatschappen",
    width: "30%",
    field: "expand.mb_group_members_via_user",
    sortable: false,
    mobilePosition: "info",
    render: (user) => {
      const memberships = user.expand?.mb_group_members_via_user || [];
      return (
        memberships
          .map((membership) => {
            const groupName = membership.expand?.group?.name || "Onbekende groep";
            const sectionName = membership.expand?.section?.name || "Onbekende sectie";
            return `${groupName}: ${sectionName}`;
          })
          .join(", ") || "Geen lidmaatschappen"
      );
    },
  },
];

const UserList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState({ sortField: "name", sortDirection: "asc", filters: {} });

  const { queryOptions } = useSmartTagFilter({
    query,
    headerColumns: HEADER_COLUMNS,
    baseOptions: {
      expand: "mb_group_members_via_user,mb_group_members_via_user.section,mb_group_members_via_user.group",
    },
  });

  // React Query hooks
  const { data, isLoading, error } = useUsers(1, 100, queryOptions);
  const handleDelete = useDeleteUserWithConfirm();

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          <AddButton onClick={() => navigate(`/users/new?${searchParams.toString()}`)} ariaLabel="Nieuwe gebruiker" />
        }
      >
        Gebruikers
      </ListHeading>
      <SmartSearch searchFields={["name", "email"]} placeholder="Zoek op naam of e-mail..." />

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <ListView
          data={data?.items || []}
          totalItems={data?.totalItems || 0}
          headerColumns={HEADER_COLUMNS}
          defaultSortField="name"
          defaultSortDirection="asc"
          emptyMessage="Geen gebruikers gevonden."
          onClick={(user) => navigate(`/users/${user.id}?${searchParams.toString()}`)}
          onDelete={handleDelete}
          onQueryChange={setQuery}
        />
      )}
    </ListContainer>
  );
};

export default UserList;
