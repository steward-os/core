import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import SmartSearch from "../../components/List/SmartSearch";
import { useSmartTagFilter } from "../../components/List/useSmartTagFilter";
import { useDeleteSettingWithConfirm, useSettings } from "../../hooks/crudResourceHooks";

const HEADER_COLUMNS = [
  {
    label: "App naam",
    width: "100%",
    field: "app_name",
    sortable: true,
    mobilePosition: "title",
  },
];

const SettingList = ({ isAdmin }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState({ sortField: "app_name", sortDirection: "asc", filters: {} });

  const { queryOptions } = useSmartTagFilter({
    query,
    headerColumns: HEADER_COLUMNS,
    baseOptions: {},
    extraConditions: [],
  });

  const { data, isLoading, error } = useSettings(1, 100, queryOptions);
  const handleDelete = useDeleteSettingWithConfirm();

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          isAdmin && (
            <AddButton
              onClick={() => navigate(`/settings/new?${searchParams.toString()}`)}
              ariaLabel="Nieuwe instelling"
            />
          )
        }
      >
        Settings
      </ListHeading>
      <SmartSearch searchFields={["app_name"]} placeholder="Zoek op app naam..." />

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <ListView
          data={data?.items || []}
          totalItems={data?.totalItems || 0}
          headerColumns={HEADER_COLUMNS}
          defaultSortField="app_name"
          defaultSortDirection="asc"
          emptyMessage="Geen settings gevonden."
          onClick={(setting) => navigate(`/settings/${setting.id}?${searchParams.toString()}`)}
          onEdit={isAdmin ? (setting) => navigate(`/settings/${setting.id}/edit?${searchParams.toString()}`) : undefined}
          onDelete={isAdmin ? handleDelete : undefined}
          onQueryChange={setQuery}
        />
      )}
    </ListContainer>
  );
};

export default SettingList;
