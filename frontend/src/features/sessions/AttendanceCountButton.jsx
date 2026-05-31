import { useState } from "react";
import AttendanceMembersModal from "./AttendanceMembersModal";

const AttendanceCountButton = ({ count, state, attendanceRecords, title, groupLabel, isSessionAdmin = false }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (count === 0) {
    return null;
  }

  // Color mapping based on state
  const colorMap = {
    aangemeld: "text-green-800",
    afgemeld: "text-orange-800",
    aanwezig: "text-green-800",
    afwezig: "text-red-800",
  };

  const colorClass = colorMap[state] || "text-gray-800";

  // Filter attendance records for this specific group and state
  const filteredRecords = attendanceRecords.filter((record) => {
    // Check state match
    let stateMatches = false;
    switch (state) {
      case "aangemeld":
        stateMatches = record.state === "will_be_present";
        break;
      case "afgemeld":
        stateMatches = record.state === "wont_be_present" || record.state === "not_present_with_notice";
        break;
      case "aanwezig":
        stateMatches = record.state === "present";
        break;
      case "afwezig":
        stateMatches = record.state === "not_present_without_notice";
        break;
    }

    return stateMatches;
  });

  // If not an admin, just render the count as text
  if (!isSessionAdmin) {
    return (
      <span className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 ${colorClass} font-medium text-xs sm:text-sm`}>
        {count}
      </span>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 ${colorClass} font-medium text-xs sm:text-sm hover:bg-gray-100 rounded transition-colors cursor-pointer`}
      >
        {count}
      </button>

      <AttendanceMembersModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        state={state}
        attendanceRecords={filteredRecords}
        groupLabel={groupLabel}
      />
    </>
  );
};

export default AttendanceCountButton;
