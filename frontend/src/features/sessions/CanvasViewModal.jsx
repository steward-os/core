import { useRef, useState } from "react";
import DialogPanel from "../../components/Modal/DialogPanel";

const CARD_W = 130;
const CARD_H = 48;

const SECTION_COLORS = [
  "border-blue-500",
  "border-purple-500",
  "border-green-500",
  "border-orange-500",
  "border-pink-500",
  "border-teal-500",
  "border-yellow-500",
  "border-red-500",
];

function getSectionColor(sectionName) {
  if (!sectionName) return "border-gray-400";
  let hash = 0;
  for (let i = 0; i < sectionName.length; i++) {
    hash = sectionName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SECTION_COLORS[Math.abs(hash) % SECTION_COLORS.length];
}

const CanvasViewModal = ({ canvasLayout, attendance, userAttendanceId, onClose }) => {
  const [panOffset, setPanOffset] = useState(() => {
    const userPos = canvasLayout[userAttendanceId];
    if (!userPos) return { x: 0, y: 0 };
    return {
      x: window.innerWidth / 2 - userPos.x - CARD_W / 2,
      y: window.innerHeight / 2 - userPos.y - CARD_H / 2,
    };
  });
  const panStart = useRef(null);

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    panStart.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handlePointerMove = (e) => {
    if (!panStart.current) return;
    setPanOffset({
      x: e.clientX - panStart.current.x,
      y: e.clientY - panStart.current.y,
    });
  };

  const handlePointerUp = () => {
    panStart.current = null;
  };

  const placed = attendance.filter((r) => !!canvasLayout[r.id]);

  return (
    <DialogPanel open title="Opstelling" onClose={onClose} noScroll fullscreen>
      <div
        className="flex-1 relative overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800 cursor-grab active:cursor-grabbing"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div style={{ position: "absolute", transform: `translate(${panOffset.x}px, ${panOffset.y}px)` }}>
          {placed.map((record) => {
            const pos = canvasLayout[record.id];
            const playerName = record.expand?.group_member?.expand?.user?.name ?? "Onbekend";
            const sectionName = record.expand?.group_member?.expand?.section?.name ?? "";
            const borderColor = getSectionColor(sectionName);
            const isMe = record.id === userAttendanceId;

            return (
              <div
                key={record.id}
                style={{ position: "absolute", left: pos.x, top: pos.y, width: CARD_W }}
                className={`border-l-4 ${borderColor} rounded-lg px-2 py-1 shadow-sm select-none ${
                  isMe ? "bg-yellow-100 ring-2 ring-yellow-400" : "bg-white dark:bg-gray-700"
                }`}
              >
                <p
                  className={`text-xs font-medium truncate leading-tight ${isMe ? "text-yellow-900" : "text-gray-800 dark:text-gray-100"}`}
                >
                  {playerName}
                </p>
                {sectionName && (
                  <p
                    className={`text-[10px] truncate leading-tight ${isMe ? "text-yellow-700" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {sectionName}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-shrink-0 flex items-center gap-2 pt-3">
        <div className="w-3 h-3 rounded-sm bg-yellow-200 ring-2 ring-yellow-400 flex-shrink-0" />
        <span className="text-xs text-gray-500 dark:text-gray-400">Jouw positie</span>
      </div>
    </DialogPanel>
  );
};

export default CanvasViewModal;
