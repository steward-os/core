import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AddButton } from "../../components/Button";
import ProgressBar from "../../components/ProgressBar";
import CenteredAlert from "../../components/CenteredAlert";
import { FilterRow, ListContainer, ListHeading } from "../../components/List";
import { ListView } from "../../components/List/ListView";
import { useDeleteVolunteeringWithConfirm, useVolunteeringFiltered } from "../../hooks/crudResourceHooks";
import { buildFetchOptions } from "../../hooks/utils/useColumnFilters";
import pb from "../../pb";
import { formatDateTime } from "../../utils/dateTimeUtils";

const VOLUNTEERING_FILTER_OPTIONS = [
  { value: "future", label: "Gepland" },
  { value: "past", label: "Afgelopen" },
  { value: "my_future", label: "Mijn aanmeldingen" },
];

// number_red / number_orange are volunteer counts, not percentages — convert to % for ProgressBar
const getVolunteeringThresholds = (item) => ({
  thresholdLow: item.number_needed > 0 && item.number_red > 0 ? (item.number_red / item.number_needed) * 100 : 50,
  thresholdHigh: item.number_needed > 0 && item.number_orange > 0 ? (item.number_orange / item.number_needed) * 100 : 70,
});

const HEADER_COLUMNS = [
  {
    label: "Datum & Tijd",
    width: "15%",
    field: "date_time",
    sortable: true,
    render: (item) => (item.date_time ? formatDateTime(item.date_time) : ""),
    mobilePosition: "info",
  },
  {
    label: "Naam",
    width: "45%",
    field: "name",
    sortable: true,
    filter: "name",
    mobilePosition: "title",
  },
  {
    label: "Mijn deelname",
    width: "20%",
    sortable: true,
    render: (item) => {
      const userId = pb.authStore?.record?.id;
      return (
        <>
          {item.expand?.mb_volunteering_attendance_via_volunteering?.some(
            (attendance) => attendance.user === userId,
          ) && (
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 mt-1">
              Ik doe mee
            </span>
          )}
        </>
      );
    },
    mobilePosition: "info",
  },
  // {
  //   label: "Status",
  //   width: "15%",
  //   field: "still_needed",
  //   sortable: true,
  //   render: (item) => (
  //     <span
  //       className={`inline-flex px-2 py-1 text-xs font-medium rounded-full
  //         ${item.still_needed === 0 ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
  //     >
  //       {item.still_needed === 0 ? "Compleet" : `Nog ${item.still_needed} nodig`}
  //     </span>
  //   ),
  //   mobilePosition: "right",
  // },
  {
    label: "Aanmelding",
    width: "20%",
    sortable: false,
    // No mobilePosition — desktop only; mobile uses renderFooter
    render: (item) => (
      <ProgressBar
        value={item.signed_up}
        total={item.number_needed}
        {...getVolunteeringThresholds(item)}
      />
    ),
  },
];

const TIME_RANGE_FILTERS = {
  future: () => `date_time >= "${new Date().toISOString().split("T")[0]}"`,
  past: () => `date_time < "${new Date().toISOString().split("T")[0]}"`,
  my_future: () =>
    `date_time >= "${new Date().toISOString().split("T")[0]}" && mb_volunteering_attendance_via_volunteering.user ?= "${pb.authStore?.record?.id}"`,
};

const VolunteeringList = ({ isVolunteerAdmin }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tableState, setTableState] = useState({ sortField: "date_time", sortDirection: "asc", filters: {} });

  // Persist the selected time-range filter (future/past/my_future) in the URL
  const volunteeringFilter = searchParams.get("volunteeringFilter") || "future";
  const setVolunteeringFilter = (value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "future") {
      newParams.delete("volunteeringFilter");
    } else {
      newParams.set("volunteeringFilter", value);
    }
    setSearchParams(newParams);
  };

  const fetchOptions = buildFetchOptions(tableState, HEADER_COLUMNS, {}, [TIME_RANGE_FILTERS[volunteeringFilter]()]);
  const { data, isLoading, error } = useVolunteeringFiltered(fetchOptions);
  const handleDelete = useDeleteVolunteeringWithConfirm();

  return (
    <ListContainer fullWidth>
      <ListHeading
        button={
          isVolunteerAdmin ? (
            <AddButton
              onClick={() => navigate(`/volunteering/new?${searchParams.toString()}`)}
              ariaLabel="Nieuwe vrijwilligers taak"
            />
          ) : null
        }
      >
        Vrijwilligers gevraagd
      </ListHeading>

      {isLoading && <CenteredAlert text="Laden..." />}
      {error && <CenteredAlert text={`Fout bij laden: ${error.message}`} />}
      {!isLoading && !error && (
        <ListView
          data={data?.items || []}
          totalItems={data?.totalItems || 0}
          headerColumns={HEADER_COLUMNS}
          defaultSortField="date_time"
          defaultSortDirection="asc"
          emptyMessage="Geen vrijwilligerswerk gevonden."
          onClick={(item) => navigate(`/volunteering/${item.id}?${searchParams.toString()}`)}
          onEdit={
            isVolunteerAdmin
              ? (item) => navigate(`/volunteering/${item.id}/edit?${searchParams.toString()}`)
              : undefined
          }
          onDelete={isVolunteerAdmin ? handleDelete : undefined}
          onQueryChange={setTableState}
          filterRow={
            isVolunteerAdmin ? (
              <FilterRow
                options={VOLUNTEERING_FILTER_OPTIONS}
                value={volunteeringFilter}
                onChange={setVolunteeringFilter}
              />
            ) : undefined
          }
          renderFooter={(item) => (
            <ProgressBar
              value={item.signed_up}
              total={item.number_needed}
              {...getVolunteeringThresholds(item)}
              label={(value, total, pct) => `${value} van ${total} aangemeld (${pct}%)`}
              mobile
            />
          )}
        />
      )}
    </ListContainer>
  );
};

export default VolunteeringList;
