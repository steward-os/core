import React from "react";

const MeetingTopicsCounters = ({ summary }) => {
  const stateConfig = {
    open: { label: "Open", color: "bg-yellow-100 text-yellow-800" },
    in_progress: { label: "In behandeling", color: "bg-blue-100 text-blue-800" },
    done: { label: "Afgerond", color: "bg-green-100 text-green-800" },
  };

  return (
    <div>
      {/* Status counters */}
      <div>
        <h4 className=" font-medium text-gray-700 mb-3">Status overzicht</h4>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(stateConfig).map(([state, config]) => (
            <div key={state} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <div className="ml-4 w-0 flex-1">
                    <dl>
                      <dt className=" font-medium text-gray-500 truncate">Aantal</dt>
                      <dd className="text-lg font-medium text-gray-900">{summary[state] || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MeetingTopicsCounters;
