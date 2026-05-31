import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../components/Button";
import CenteredAlert from "../../components/CenteredAlert";
import { FilterRow, ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import SmartSearch from "../../components/List/SmartSearch";
import { useSmartTagFilter } from "../../components/List/useSmartTagFilter";
import { useDeleteMeetingWithConfirm, useMeetings } from "../../hooks/crudResourceHooks";

const HEADER_COLUMNS = [
  {
    label: "Datum & Tijd",
    width: "30%",
    field: "date_time",
    sortable: true,
    mobilePosition: "info",
  },
  {
    label: "Naam",
    width: "40%",
    field: "name",
    sortable: true,
    mobilePosition: "title",
  },
  {
    label: "Template",
    width: "15%",
    field: "expand.meeting_template.name",
    render: (meeting) => meeting.expand?.meeting_template?.name || "",
    sortable: false,
    mobilePosition: "info",
  },
];

const MEETING_FILTER_OPTIONS = [
  { value: "future", label: "Gepland" },
  { value: "past", label: "Afgelopen" },
];

const MeetingList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState({ sortField: "date_time", sortDirection: "desc", filters: {} });

  // Get meeting filter from URL params
  const meetingFilter = searchParams.get("meetingFilter") || "future";

  // Update URL when filter changes
  const setMeetingFilter = (value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "all") {
      newParams.delete("meetingFilter");
    } else {
      newParams.set("meetingFilter", value);
    }
    setSearchParams(newParams);
  };

  const today = new Date().toISOString().split("T")[0];
  const timeFilter = meetingFilter === "future" ? `date_time >= "${today}"` : `date_time < "${today}"`;
  const { queryOptions } = useSmartTagFilter({
    query,
    headerColumns: HEADER_COLUMNS,
    baseOptions: { expand: "meeting_template" },
    extraConditions: [timeFilter],
  });

  // React Query hooks
  const { data, isLoading, error } = useMeetings(1, 100, queryOptions);
  const handleDelete = useDeleteMeetingWithConfirm();

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          <AddButton
            onClick={() => navigate(`/meetings/new?${searchParams.toString()}`)}
            ariaLabel="Nieuwe vergadering"
          />
        }
      >
        Vergaderingen
      </ListHeading>
      <SmartSearch searchFields={["name"]} placeholder="Zoek op naam..." />

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <ListView
          data={data?.items || []}
          totalItems={data?.totalItems || 0}
          headerColumns={HEADER_COLUMNS}
          defaultSortField="date_time"
          defaultSortDirection="desc"
          emptyMessage="Geen vergaderingen gevonden."
          onClick={(meeting) => navigate(`/meetings/${meeting.id}?${searchParams.toString()}`)}
          onEdit={(meeting) => navigate(`/meetings/${meeting.id}/edit?${searchParams.toString()}`)}
          onDelete={handleDelete}
          onQueryChange={setQuery}
          filterRow={<FilterRow options={MEETING_FILTER_OPTIONS} value={meetingFilter} onChange={setMeetingFilter} />}
        />
      )}
    </ListContainer>
  );
};

export default MeetingList;
