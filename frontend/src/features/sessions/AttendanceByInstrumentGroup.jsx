import AttendanceCountButton from "./AttendanceCountButton";

const AttendanceByInstrumentGroup = ({ attendance, isSessionAdmin = false }) => {
  // Group attendance by section and state
  const groupedData = attendance.reduce((acc, record) => {
    const section = record.expand?.group_member?.expand?.section?.name || "Onbekend";

    if (!acc[section]) {
      acc[section] = {
        aangemeld: 0,
        afgemeld: 0,
        aanwezig: 0,
        afwezig: 0,
        records: [],
      };
    }

    // Store the record
    acc[section].records.push(record);

    // Map states to the four categories
    switch (record.state) {
      case "will_be_present":
        acc[section].aangemeld++;
        break;
      case "wont_be_present":
      case "not_present_with_notice":
        acc[section].afgemeld++;
        break;
      case "present":
        acc[section].aanwezig++;
        break;
      case "not_present_without_notice":
        acc[section].afwezig++;
        break;
    }

    return acc;
  }, {});

  // Sort sections alphabetically
  const sortedSections = Object.keys(groupedData).sort();

  if (sortedSections.length === 0) {
    return null;
  }

  // Calculate column totals to determine which columns to show
  const columnTotals = {
    aangemeld: 0,
    afgemeld: 0,
    aanwezig: 0,
    afwezig: 0,
  };

  sortedSections.forEach((section) => {
    columnTotals.aangemeld += groupedData[section].aangemeld;
    columnTotals.afgemeld += groupedData[section].afgemeld;
    columnTotals.aanwezig += groupedData[section].aanwezig;
    columnTotals.afwezig += groupedData[section].afwezig;
  });

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <div className="glass-header px-4 py-3">
        <h3 className="text-lg font-medium text-[var(--text-primary)]">Per sectie</h3>
      </div>
      <div className="overflow-x-auto">
          <table className="min-w-full w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/10">
              <th className="text-left px-4 py-3 font-semibold text-[var(--text-secondary)] text-xs uppercase tracking-wider">Group</th>
              {columnTotals.aangemeld > 0 && (
                <th className="text-xs sm:text-sm text-center px-2 sm:px-4 py-3 font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Aangemeld</th>
              )}
              {columnTotals.afgemeld > 0 && (
                <th className="text-xs sm:text-sm text-center px-2 sm:px-4 py-3 font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Afgemeld</th>
              )}
              {columnTotals.aanwezig > 0 && (
                <th className="text-xs sm:text-sm text-center px-2 sm:px-4 py-3 font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Aanwezig</th>
              )}
              {columnTotals.afwezig > 0 && (
                <th className="text-xs sm:text-sm text-center px-2 sm:px-4 py-3 font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Afwezig</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-white/10">
            {sortedSections.map((section) => {
              const counts = groupedData[section];
              return (
                <tr key={section} className="hover:bg-white/5 dark:hover:bg-white/10 transition-colors">
                  <td className="px-4 py-3 text-[var(--text-primary)] font-medium text-sm">{section}</td>
                  {columnTotals.aangemeld > 0 && (
                    <td className="px-2 sm:px-4 py-2 text-center">
                      <AttendanceCountButton
                        count={counts.aangemeld}
                        state="aangemeld"
                        attendanceRecords={counts.records}
                        title="Aanwezigheid per sectie"
                        groupLabel={section}
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
                        title="Aanwezigheid per sectie"
                        groupLabel={section}
                        isSessionAdmin={isSessionAdmin}
                      />
                    </td>
                  )}
                  {columnTotals.aanwezig > 0 && (
                    <td className="px-2 sm:px-4 py-2 text-center">
                      <AttendanceCountButton
                        count={counts.aanwezig}
                        state="aanwezig"
                        attendanceRecords={counts.records}
                        title="Aanwezigheid per sectie"
                        groupLabel={section}
                        isSessionAdmin={isSessionAdmin}
                      />
                    </td>
                  )}
                  {columnTotals.afwezig > 0 && (
                    <td className="px-2 sm:px-4 py-2 text-center">
                      <AttendanceCountButton
                        count={counts.afwezig}
                        state="afwezig"
                        attendanceRecords={counts.records}
                        title="Aanwezigheid per sectie"
                        groupLabel={section}
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

export default AttendanceByInstrumentGroup;
