import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../../components/Button";
import CenteredAlert from "../../../components/CenteredAlert";
import { ListContainer, ListHeading } from "../../../components/List";
import { ListView } from "../../../components/List/ListView";
import SmartSearch from "../../../components/List/SmartSearch";
import { useSmartTagFilter } from "../../../components/List/useSmartTagFilter";
import { useDeleteMediaFileWithConfirm, useMediaFiles } from "../../../hooks/crudResourceHooks";

const HEADER_COLUMNS = [
    {
        label: "Naam",
        width: "50%",
        field: "name",
        sortable: true,
        filter: "name",
        mobilePosition: "title",
    },
    {
        label: "Bestand",
        width: "50%",
        field: "file",
        mobilePosition: "info",
    },
];

const MediaFileList = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState({ sortField: "name", sortDirection: "asc", filters: {} });

    const { queryOptions } = useSmartTagFilter({ query, headerColumns: HEADER_COLUMNS });
    const { data, isLoading, error } = useMediaFiles(1, 100, queryOptions);
    const handleDelete = useDeleteMediaFileWithConfirm();

    return (
        <ListContainer fullWidth>
            <ListHeading
                button={
                    <AddButton
                        onClick={() => navigate(`/media-files/new?${searchParams.toString()}`)}
                        ariaLabel="Nieuw bestand"
                    />
                }
            >
                Bestanden
            </ListHeading>
            <SmartSearch searchFields={["name"]} placeholder="Zoek op naam..." />

            {isLoading && <CenteredAlert text="Laden..." />}
            {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
            {!isLoading && !error && (
                <ListView
                    data={data?.items || []}
                    totalItems={data?.totalItems || 0}
                    headerColumns={HEADER_COLUMNS}
                    defaultSortField="name"
                    defaultSortDirection="asc"
                    emptyMessage="Geen bestanden gevonden."
                    onClick={(item) => navigate(`/media-files/${item.id}?${searchParams.toString()}`)}
                    onEdit={(item) => navigate(`/media-files/${item.id}/edit?${searchParams.toString()}`)}
                    onDelete={handleDelete}
                    onQueryChange={setQuery}
                />
            )}
        </ListContainer>
    );
};

export default MediaFileList;
