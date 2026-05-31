import ProgressBar from "../../components/ProgressBar";
import { ListView } from "../../components/List/ListView";
import { formatDateTime } from "../../utils/dateTimeUtils";

const statesDisplay = {
  will_be_present: {
    name: "Aangemeld",
    className: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
  },
  wont_be_present: {
    name: "Afgemeld",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  },
  not_present_without_notice: {
    name: "Afwezig zonder afmelding",
    className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
  },
  not_present_with_notice: {
    name: "Afwezig met afmelding",
    className: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  },
  present: { name: "Aanwezig", className: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300" },
};

const HEADER_COLUMNS = [
  {
    label: "Datum & Tijd",
    width: "25%",
    field: "expand.session.date_time",
    render: (record) => (record.expand?.session ? formatDateTime(record.expand.session.date_time) : ""),
    sortable: false,
    mobilePosition: "info",
  },
  {
    label: "Naam",
    width: "50%",
    field: "expand.session.name",
    render: (record) => (
      <div>
        <div className="font-medium text-[var(--text-primary)]">{record.expand?.session?.name || ""}</div>
      </div>
    ),
    sortable: false,
    mobilePosition: "title",
  },
  {
    label: "Groups",
    width: "25%",
    field: "",
    render: (record) => (
      <div>
        <div className="text-[var(--text-primary)]">
          {record.expand?.session?.expand?.groups.map((o) => o.name).join(", ") || ""}
        </div>
      </div>
    ),
    sortable: false,
    mobilePosition: "info",
  },
  {
    label: "Status",
    width: "25%",
    field: "state",
    render: (record) => (
      <span className={`text-sm inline-flex px-2 py-1 rounded-full ${statesDisplay[record.state]?.className}`}>
        {statesDisplay[record.state]?.name || record.state}
      </span>
    ),
    sortable: false,
    mobilePosition: "right",
  },
];

const AttendanceList = ({ rehearsals, loading, onItemClick, filterRow, sessionStats = {} }) => {
  const headerColumns = [
    ...HEADER_COLUMNS,
    {
      label: "Aanwezigheid",
      width: "25%",
      field: "",
      sortable: false,
      // No mobilePosition — desktop only; mobile uses renderFooter
      render: (record) => {
        const sid = record.expand?.session?.id;
        const stats = sessionStats[sid];
        const session = record.expand?.session;
        return (
          <ProgressBar
            value={stats?.present}
            total={stats?.total}
            thresholdLow={session?.threshold_orange ?? 50}
            thresholdHigh={session?.threshold_green ?? 70}
            label={(value, total, pct) => `${value} van ${total} aangemeld (${pct}%)`}
          />
        );
      },
    },
  ];

  const renderFooter = (item) => {
    const sid = item.expand?.session?.id;
    const stats = sessionStats[sid];
    const session = item.expand?.session;
    return (
      <ProgressBar
        value={stats?.present}
        total={stats?.total}
        thresholdLow={session?.threshold_orange ?? 50}
        thresholdHigh={session?.threshold_green ?? 70}
        label={(value, total, pct) => `${value} van ${total} aangemeld (${pct}%)`}
        mobile
      />
    );
  };

  return (
    <ListView
      data={rehearsals || []}
      totalItems={rehearsals?.length || 0}
      headerColumns={headerColumns}
      emptyMessage="Geen repetities of optredens gevonden."
      onClick={onItemClick}
      loading={loading}
      filterRow={filterRow}
      renderFooter={renderFooter}
    />
  );
};

export default AttendanceList;
