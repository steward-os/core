import DialogPanel from "../../components/Modal/DialogPanel";

const AttendanceMembersModal = ({ isOpen, onClose, title, state, attendanceRecords, groupLabel }) => {
  // State display names
  const stateLabels = {
    aangemeld: "Aangemeld",
    afgemeld: "Afgemeld",
    aanwezig: "Aanwezig",
    afwezig: "Afwezig",
  };

  const stateLabel = stateLabels[state] || state;

  return (
    <DialogPanel
      open={isOpen}
      title={`${title} - ${groupLabel}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            {stateLabel} ({attendanceRecords.length})
          </h4>

          {attendanceRecords.length === 0 ? (
            <p className="text-gray-500 text-sm">Geen leden gevonden.</p>
          ) : (
            <div className="space-y-2">
              {attendanceRecords.map((record) => {
                const member = record.expand?.group_member;
                const memberName = member?.expand?.user?.name || "Onbekend";

                return (
                  <div
                    key={record.id}
                    className="flex items-center px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <span className="text-sm text-gray-900 dark:text-gray-100">{memberName}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DialogPanel>
  );
};

export default AttendanceMembersModal;
