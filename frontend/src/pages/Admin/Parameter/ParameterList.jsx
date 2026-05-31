import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../../components/Button";
import CenteredAlert from "../../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../../components/List";
import { ListView } from "../../../components/List/ListView";
import SmartSearch from "../../../components/List/SmartSearch";
import { useSmartTagFilter } from "../../../components/List/useSmartTagFilter";
import { useDeleteParameterWithConfirm, useParameters } from "../../../hooks/crudResourceHooks";

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
        label: "Waarde",
        width: "30%",
        field: "value",
        sortable: true,
        filter: "value",
        mobilePosition: "info",
    },
    {
        label: "Omschrijving",
        width: "40%",
        field: "description",
        sortable: true,
        filter: "description",
        mobilePosition: "info",
    },
];

const ParameterList = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState({ sortField: "name", sortDirection: "asc", filters: {} });

    const { queryOptions } = useSmartTagFilter({ query, headerColumns: HEADER_COLUMNS });
    const { data, isLoading, error } = useParameters(1, 100, queryOptions);
    const handleDelete = useDeleteParameterWithConfirm();

    return (
        <ListContainer fullWidth>
            <ListHeading
                button={
                    <AddButton
                        onClick={() => navigate(`/parameters/new?${searchParams.toString()}`)}
                        ariaLabel="Nieuwe parameter"
                    />
                }
            >
                Parameters
            </ListHeading>
            <SmartSearch searchFields={["name", "value", "description"]} placeholder="Zoek op naam, waarde of omschrijving..." />

            {isLoading && <CenteredAlert text="Laden..." />}
            {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
            {!isLoading && !error && (
                <ListView
                    data={data?.items || []}
                    totalItems={data?.totalItems || 0}
                    headerColumns={HEADER_COLUMNS}
                    defaultSortField="name"
                    defaultSortDirection="asc"
                    emptyMessage="Geen parameters gevonden."
                    onClick={(item) => navigate(`/parameters/${item.id}?${searchParams.toString()}`)}
                    onEdit={(item) => navigate(`/parameters/${item.id}/edit?${searchParams.toString()}`)}
                    onDelete={handleDelete}
                    onQueryChange={setQuery}
                />
            )}
        </ListContainer>
    );
};

export default ParameterList;
