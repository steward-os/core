import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { useEffect, useMemo, useState } from "react";
import CenteredSpinner from "../../components/CenteredSpinner";
import Select from "../../components/Form/Select";
import { ListContainer, ListHeading } from "../../components/List";
import { stateLabels } from "../../features/sessions/stateVars";
import { useAppHeaderVisibility } from "../../hooks/useAppHeaderVisibility";
import { getAttendanceForMatrix } from "../../services/attendanceService";
import { getGroupMembers, getGroups } from "../../services/groupService";
import { getSessionsForGroup } from "../../services/sessionService";

const DESKTOP_SESSIONS_VISIBLE = 20;
const MOBILE_SESSIONS_VISIBLE = 4;

const NL_MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

function formatSessionDate(dateTime) {
  const d = new Date(dateTime);
  return `${d.getDate()} ${NL_MONTHS[d.getMonth()]}`;
}

const STATE_CELL_CLASSES = {
  will_be_present: "bg-green-400 dark:bg-green-700",
  present: "bg-green-500 dark:bg-green-700",
  wont_be_present: "bg-orange-400 dark:bg-orange-700",
  not_present_with_notice: "bg-orange-400 dark:bg-orange-700",
  not_present_without_notice: "bg-red-500 dark:bg-red-700",
};

function AttendanceCell({ state, section }) {
  if (!state) {
    return (
      <div className="flex-1 overflow-hidden flex items-center justify-center px-1 py-2 bg-yellow-50 dark:bg-white/5">
        <span className="text-yellow-400 dark:text-white/20 select-none text-xs">–</span>
      </div>
    );
  }
  return (
    <div
      className={`flex-1 overflow-hidden flex items-center justify-center px-1 py-2 ${STATE_CELL_CLASSES[state] || "bg-gray-300"}`}
      title={stateLabels[state]}
    >
      <span className="text-white text-[10px] font-semibold leading-tight overflow-hidden whitespace-nowrap w-full text-center px-0.5">
        {section || ""}
      </span>
    </div>
  );
}

export default function AttendanceMatrix() {
  const { isMobile } = useAppHeaderVisibility();
  const sessionsVisible = isMobile ? MOBILE_SESSIONS_VISIBLE : DESKTOP_SESSIONS_VISIBLE;

  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [members, setMembers] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [sessionOffset, setSessionOffset] = useState(0);
  const [attendance, setAttendance] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [onlyPerformances, setOnlyPerformances] = useState(false);

  // Load groups on mount, auto-select first
  useEffect(() => {
    getGroups({ sort: "name" })
      .then((data) => {
        setGroups(data);
        if (data.length > 0) setSelectedGroupId(data[0].id);
      })
      .finally(() => setLoadingGroups(false));
  }, []);

  // Load members + sessions when selected group changes
  useEffect(() => {
    if (!selectedGroupId) return;
    setLoadingMatrix(true);
    Promise.all([getGroupMembers(selectedGroupId), getSessionsForGroup(selectedGroupId)])
      .then(([memberData, sessionData]) => {
        const sorted = [...memberData].sort((a, b) => {
          const secA = a.expand?.section?.name || "";
          const secB = b.expand?.section?.name || "";
          if (secA !== secB) return secA.localeCompare(secB);
          const nameA = a.expand?.user?.name || "";
          const nameB = b.expand?.user?.name || "";
          return nameA.localeCompare(nameB);
        });
        setMembers(sorted);
        setAllSessions(sessionData);
        const now = new Date();
        const sessions = onlyPerformances ? sessionData.filter((s) => s.type === "performance") : sessionData;
        const firstFutureIndex = sessions.findIndex((s) => new Date(s.date_time) >= now);
        setSessionOffset(firstFutureIndex === -1 ? 0 : firstFutureIndex);
      })
      .catch(() => {
        setMembers([]);
        setAllSessions([]);
      })
      .finally(() => setLoadingMatrix(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId]);

  const filteredSessions = useMemo(
    () => (onlyPerformances ? allSessions.filter((s) => s.type === "performance") : allSessions),
    [allSessions, onlyPerformances]
  );

  const visibleSessions = filteredSessions.slice(sessionOffset, sessionOffset + sessionsVisible);

  // Jump to first future session when filter changes
  useEffect(() => {
    const now = new Date();
    const firstFutureIndex = filteredSessions.findIndex((s) => new Date(s.date_time) >= now);
    setSessionOffset(firstFutureIndex === -1 ? 0 : firstFutureIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyPerformances]);

  // Load attendance for the current session window
  useEffect(() => {
    if (!selectedGroupId || visibleSessions.length === 0) {
      setAttendance([]);
      return;
    }
    const sessionIds = visibleSessions.map((s) => s.id);
    getAttendanceForMatrix(sessionIds, selectedGroupId).then(setAttendance);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId, sessionOffset, sessionsVisible, allSessions, onlyPerformances]);

  // Build lookup: { groupMemberId: { sessionId: state } }
  const matrix = useMemo(() => {
    const map = {};
    attendance.forEach((record) => {
      const memberId = record.group_member;
      const sessionId = record.session;
      if (!map[memberId]) map[memberId] = {};
      map[memberId][sessionId] = record.state;
    });
    return map;
  }, [attendance]);

  const canGoPrev = sessionOffset > 0;
  const canGoNext = sessionOffset + sessionsVisible < filteredSessions.length;

  if (loadingGroups) return <CenteredSpinner />;

  return (
    <ListContainer fullWidth>
      <ListHeading>Overzicht aanwezigheid</ListHeading>

      {/* Group selector */}
      <div className="flex items-center gap-3 px-4 pb-3 flex-wrap">
        <span className="text-[13px] font-medium text-[var(--text-secondary)] whitespace-nowrap">Groep:</span>
        <Select
          id="group-select"
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="w-52"
        >
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyPerformances}
            onChange={(e) => setOnlyPerformances(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-[13px] font-medium text-[var(--text-secondary)] whitespace-nowrap">Alleen optredens</span>
        </label>
      </div>

      {loadingMatrix ? (
        <CenteredSpinner />
      ) : !selectedGroupId ? (
        <div className="text-center text-[var(--text-secondary)] py-8">Selecteer een groep</div>
      ) : allSessions.length === 0 ? (
        <div className="text-center text-[var(--text-secondary)] py-8">Geen sessies gevonden voor deze groep</div>
      ) : (
        <>
          {/* Sticky column header row — matches FlexHeader styling */}
          {/* top-0 on mobile (AppHeader is a floating button, not a bar) */}
          {/* top-12 on desktop (AppHeader is a fixed 48px bar) */}
          <div className="glass-header flex items-center py-2.5 px-4 sticky top-0 md:top-12 z-10">
            {/* Name column: navigation arrows + session window counter */}
            <div className="w-40 md:w-44 shrink-0 font-medium text-[var(--text-secondary)] text-[13px] tracking-wide">
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => setSessionOffset(Math.max(0, sessionOffset - sessionsVisible))}
                  disabled={!canGoPrev}
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Vorige sessies"
                >
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    setSessionOffset(Math.min(filteredSessions.length - sessionsVisible, sessionOffset + sessionsVisible))
                  }
                  disabled={!canGoNext}
                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Volgende sessies"
                >
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-[var(--text-secondary)] opacity-70 ml-0.5">
                  {sessionOffset + 1}–{Math.min(sessionOffset + sessionsVisible, filteredSessions.length)}/
                  {filteredSessions.length}
                </span>
              </div>
            </div>

            {/* Session date column headers */}
            {visibleSessions.map((session) => (
              <div
                key={session.id}
                className="w-10 md:w-16 shrink-0 text-center font-medium text-[var(--text-secondary)] text-[11px] tracking-wide leading-tight"
              >
                <div className="flex flex-col items-center">
                  <span className="whitespace-nowrap">{formatSessionDate(session.date_time)}</span>
                  {session.name && (
                    <span className="text-[10px] opacity-60 truncate w-full text-center" title={session.name}>
                      {session.name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Member rows */}
          <div>
            {members.map((member) => (
              <div
                key={member.id}
                className="border-b border-gray-200 dark:border-white/10 last:border-0 flex items-stretch px-4 hover:bg-blue-100/60 dark:hover:bg-white/5 transition-colors duration-150"
              >
                <div
                  className="w-40 md:w-44 shrink-0 min-w-0 py-3 px-0.5 text-sm font-medium text-[var(--text-primary)] truncate"
                  title={member.expand?.user?.name}
                >
                  {member.expand?.user?.name || "–"}
                </div>
                {visibleSessions.map((session) => (
                  <div key={session.id} className="w-10 md:w-16 shrink-0 flex">
                    <AttendanceCell
                      state={matrix[member.id]?.[session.id]}
                      section={member.expand?.section?.name}
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </ListContainer>
  );
}
