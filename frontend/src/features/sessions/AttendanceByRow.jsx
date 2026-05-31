import AttendanceCountButton from "./AttendanceCountButton";

const AttendanceByRow = ({ attendance, isSessionAdmin = false }) => {
  // Group attendance by row and state
  const groupedData = attendance.reduce((acc, record) => {
    const row = record.expand?.group_member?.default_row ?? "Onbekend";
    const rowLabel = row === "Onbekend" ? "Onbekend" : `Rij ${row}`;

    if (!acc[rowLabel]) {
      acc[rowLabel] = {
        aangemeld: 0,
        afgemeld: 0,
        records: [],
      };
    }

    // Store the record
    acc[rowLabel].records.push(record);

    switch (record.state) {
      case "will_be_present":
        acc[rowLabel].aangemeld++;
        break;
      case "wont_be_present":
      case "not_present_with_notice":
        acc[rowLabel].afgemeld++;
        break;
    }

    return acc;
  }, {});

  // Sort rows: numeric rows first (by number), then "Onbekend" last
  const sortedRows = Object.keys(groupedData).sort((a, b) => {
    if (a === "Onbekend") return 1;
    if (b === "Onbekend") return -1;
    const numA = parseInt(a.replace("Rij ", ""));
    const numB = parseInt(b.replace("Rij ", ""));
    return numA - numB;
  });

  if (sortedRows.length === 0) {
    return null;
  }

  // Calculate column totals to determine which columns to show
  const columnTotals = {
    aangemeld: 0,
    afgemeld: 0,
  };

  sortedRows.forEach((row) => {
    columnTotals.aangemeld += groupedData[row].aangemeld;
    columnTotals.afgemeld += groupedData[row].afgemeld;
  });

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="glass-header px-4 py-3">
        <h3 className="text-lg font-medium text-[var(--text-primary)]">Per rij</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/10">
              <th className="text-left px-4 py-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">
                Rij
              </th>
              {columnTotals.aangemeld > 0 && (
                <th className="text-xs sm:text-sm text-center px-2 sm:px-4 py-3 font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Aangemeld
                </th>
              )}
              {columnTotals.afgemeld > 0 && (
                <th className="text-xs sm:text-sm text-center px-2 sm:px-4 py-3 font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Afgemeld
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/10">
            {sortedRows.map((row) => {
              const counts = groupedData[row];
              return (
                <tr key={row} className="hover:bg-white/5 dark:hover:bg-white/10 transition-colors">
                  <td className="px-4 py-3 text-[var(--text-primary)] font-medium text-sm">{row}</td>
                  {columnTotals.aangemeld > 0 && (
                    <td className="px-2 sm:px-4 py-2 text-center">
                      <AttendanceCountButton
                        count={counts.aangemeld}
                        state="aangemeld"
                        attendanceRecords={counts.records}
                        title="Aanwezigheid per rij"
                        groupLabel={row}
                        isSessionAdmin={isSessionAdmin}
                      />
                    </td>
                  )}
                  {columnTotals.afgemeld > 0 && (
                    <td className="px-2 sm:px-4 py-2 text-center">
                      <AttendanceCountButton
                        count={counts.afgemeld}
                        state="afgemeld"
                        attendanceRecords={counts.records}
                        title="Aanwezigheid per rij"
                        groupLabel={row}
                        isSessionAdmin={isSessionAdmin}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceByRow;
