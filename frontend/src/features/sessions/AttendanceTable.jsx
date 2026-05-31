import { stateLabels } from "./stateVars";
import { getStateColorClass } from "../../utils/attendanceUtils";

const AttendanceTable = ({ attendance, selectedRowKeys, setSelectedRowKeys }) => {
  const handleRowSelect = (recordId) => {
    const newSelectedKeys = selectedRowKeys.includes(recordId)
      ? selectedRowKeys.filter((key) => key !== recordId)
      : [...selectedRowKeys, recordId];
    setSelectedRowKeys(newSelectedKeys);
  };

  const handleSelectAll = () => {
    const allKeys = attendance.map((record) => record.id);
    const allSelected = allKeys.every((key) => selectedRowKeys.includes(key));
    setSelectedRowKeys(allSelected ? [] : allKeys);
  };

  const isAllSelected = attendance.length > 0 && attendance.every((record) => selectedRowKeys.includes(record.id));
  const isIndeterminate = selectedRowKeys.length > 0 && !isAllSelected;

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr className="border-b border-gray-200 dark:border-white/10">
            <th className="w-12 px-4 py-3">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(input) => {
                  if (input) input.indeterminate = isIndeterminate;
                }}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
            </th>
            <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Naam</th>
            <th className="text-left px-4 py-3 font-medium text-[var(--text-secondary)]">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-white/10">
          {attendance.map((record) => {
            const group_member = record.expand.group_member;
            const isSelected = selectedRowKeys.includes(record.id);

            return (
              <tr key={record.id} className={`transition-colors ${isSelected ? "bg-blue-500/10" : "hover:bg-[var(--glass-bg)]"}`}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleRowSelect(record.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </td>
                <td className="px-4 py-3 text-[var(--text-primary)]">
                  {(group_member.expand.section?.name || "-") + " - " + (group_member.expand.user?.name || "-")}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex text-xs px-2 py-1 font-medium rounded-full ${getStateColorClass(
                      record.state
                    )}`}
                  >
                    {stateLabels[record.state] || record.state}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
