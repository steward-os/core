import { stateLabels } from "./stateVars";
import { getStateColorClass } from "../../utils/attendanceUtils";

const AttendanceCounters = ({ stateCounts }) => {
  return (
    <div className="my-4 flex gap-3 flex-wrap">
      {Object.entries(stateLabels).map(([state, label]) =>
        stateCounts[state] > 0 ? (
          <span
            key={state}
            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStateColorClass(state)}`}
          >
            {label}: {stateCounts[state]}
          </span>
        ) : null
      )}
    </div>
  );
};

export default AttendanceCounters;
