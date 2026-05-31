import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

class MouseSensor extends PointerSensor {
  static activators = [
    {
      eventName: "onPointerDown",
      handler: ({ nativeEvent: event }, { onActivation }) => {
        if (event.pointerType !== "mouse") return false;
        return PointerSensor.activators[0].handler({ nativeEvent: event }, { onActivation });
      },
    },
  ];
}

class SingleTouchSensor extends TouchSensor {
  static activators = [
    {
      eventName: "onTouchStart",
      handler: ({ nativeEvent: event }, { onActivation }) => {
        if (event.touches.length > 1) return false;
        return TouchSensor.activators[0].handler({ nativeEvent: event }, { onActivation });
      },
    },
  ];
}

const CARD_W = 160;
const CARD_H = 48;
const DEFAULT_HEIGHT = 800;

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

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function CardContent({ record }) {
  const playerName = record.expand?.group_member?.expand?.user?.name ?? "Onbekend";
  const sectionName = record.expand?.group_member?.expand?.section?.name ?? "";
  const borderColor = getSectionColor(sectionName);
  return (
    <div
      className={`border-l-4 ${borderColor} bg-white/95 dark:bg-slate-800/95 rounded-lg px-2 py-1 shadow-sm select-none`}
      style={{ width: CARD_W }}
    >
      <p className="text-xs font-medium text-[var(--text-primary)] truncate leading-tight">{playerName}</p>
      {sectionName && <p className="text-[10px] text-[var(--text-secondary)] truncate leading-tight">{sectionName}</p>}
    </div>
  );
}

function CanvasCard({ record, position, isAdmin, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: record.id,
    disabled: !isAdmin,
    data: { source: "canvas" },
  });

  const playerName = record.expand?.group_member?.expand?.user?.name ?? "Onbekend";
  const sectionName = record.expand?.group_member?.expand?.section?.name ?? "";
  const borderColor = getSectionColor(sectionName);

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...(isAdmin ? listeners : {})}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        width: CARD_W,
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        zIndex: isDragging ? 100 : 1,
        opacity: isDragging ? 0 : 1,
        touchAction: "none",
      }}
      className={`border-l-4 ${borderColor} bg-white/95 dark:bg-slate-800/95 rounded-lg px-2 py-1 shadow-sm select-none ${isAdmin ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="text-xs font-medium text-[var(--text-primary)] truncate leading-tight">{playerName}</p>
          {sectionName && (
            <p className="text-[10px] text-[var(--text-secondary)] truncate leading-tight">{sectionName}</p>
          )}
        </div>
        {isAdmin && onRemove && (
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onRemove(record.id);
            }}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs leading-none mt-0.5"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

function SidebarCard({ record, isAdmin, onPlace, lastDragEnd }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: record.id,
    disabled: !isAdmin,
    data: { source: "sidebar" },
  });

  const playerName = record.expand?.group_member?.expand?.user?.name ?? "Onbekend";
  const sectionName = record.expand?.group_member?.expand?.section?.name ?? "";
  const borderColor = getSectionColor(sectionName);

  const handleClick = () => {
    if (!isAdmin) return;
    if (Date.now() - lastDragEnd.current < 150) return;
    onPlace(record.id);
  };

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...(isAdmin ? listeners : {})}
      onClick={handleClick}
      style={{
        width: CARD_W,
        transform: isDragging
          ? undefined
          : transform
            ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
            : undefined,
        opacity: isDragging ? 0.3 : 1,
        touchAction: "none",
      }}
      className={`border-l-4 ${borderColor} bg-white/95 dark:bg-slate-800/95 rounded-lg px-2 py-1 shadow-sm ${isAdmin ? "hover:shadow-md cursor-grab active:cursor-grabbing" : "cursor-default"}`}
    >
      <p className="text-xs font-medium text-[var(--text-primary)] truncate leading-tight">{playerName}</p>
      {sectionName && <p className="text-[10px] text-[var(--text-secondary)] truncate leading-tight">{sectionName}</p>}
    </div>
  );
}

const SessionCanvas = ({ attendance, canvasLayout, isSessionAdmin, onLayoutChange, modal = false }) => {
  const [positions, setPositions] = useState(() => canvasLayout ?? {});
  const [canvasHeight, setCanvasHeight] = useState(DEFAULT_HEIGHT);
  const [selectedSection, setSelectedSection] = useState("");
  const [draggingId, setDraggingId] = useState(null);
  const canvasRef = useRef(null);
  const scrollWrapRef = useRef(null);
  const resizeRef = useRef(null);
  const lastDragEnd = useRef(0);
  const panState = useRef(null);

  useEffect(() => {
    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        panState.current = {
          prevMidX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          prevMidY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      }
    };
    const onTouchMove = (e) => {
      if (e.touches.length !== 2 || !panState.current) return;
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      const dx = midX - panState.current.prevMidX;
      const dy = midY - panState.current.prevMidY;
      if (scrollWrapRef.current) scrollWrapRef.current.scrollLeft -= dx;
      window.scrollBy(0, -dy);
      panState.current = { prevMidX: midX, prevMidY: midY };
    };
    const onTouchEnd = (e) => {
      if (e.touches.length < 2) panState.current = null;
    };
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: "canvas" });

  const setCanvasRef = (node) => {
    canvasRef.current = node;
    setDropRef(node);
  };

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(SingleTouchSensor, { activationConstraint: { distance: 8 } }),
  );

  const handleDragStart = ({ active }) => {
    setDraggingId(active.id);
  };

  const handleDragEnd = ({ active, delta }) => {
    lastDragEnd.current = Date.now();
    setDraggingId(null);
    const id = active.id;

    if (positions[id]) {
      // Already on canvas — reposition
      const current = positions[id];
      const maxX = (canvasRef.current?.offsetWidth ?? 800) - CARD_W;
      const maxY = modal ? (canvasRef.current?.offsetHeight ?? 500) - CARD_H : canvasHeight - CARD_H;
      const updated = {
        ...positions,
        [id]: {
          x: clamp(current.x + delta.x, 0, maxX),
          y: clamp(current.y + delta.y, 0, maxY),
        },
      };
      setPositions(updated);
      onLayoutChange(updated);
    } else {
      // From sidebar — place at drop position
      const canvasEl = canvasRef.current;
      const translatedRect = active.rect.current?.translated;
      if (!canvasEl || !translatedRect) {
        handlePlace(id);
        return;
      }
      const canvasRect = canvasEl.getBoundingClientRect();
      // Only place if dropped within canvas bounds
      if (
        translatedRect.right < canvasRect.left ||
        translatedRect.left > canvasRect.right ||
        translatedRect.bottom < canvasRect.top ||
        translatedRect.top > canvasRect.bottom
      )
        return;
      const x = clamp(translatedRect.left - canvasRect.left, 0, canvasRect.width - CARD_W);
      const y = clamp(translatedRect.top - canvasRect.top, 0, canvasRect.height - CARD_H);
      const updated = { ...positions, [id]: { x, y } };
      setPositions(updated);
      onLayoutChange(updated);
    }
  };

  const handleDragCancel = () => {
    lastDragEnd.current = Date.now();
    setDraggingId(null);
  };

  const handlePlace = (id) => {
    const offset = (Object.keys(positions).length % 10) * 20;
    const updated = { ...positions, [id]: { x: 10 + offset, y: 10 + offset } };
    setPositions(updated);
    onLayoutChange(updated);
  };

  const handleRemove = (id) => {
    const { [id]: _removed, ...rest } = positions;
    setPositions(rest);
    onLayoutChange(rest);
  };

  const handleReset = () => {
    if (!window.confirm("Weet je zeker dat je alle leden van het canvas wilt verwijderen?")) return;
    setPositions({});
    onLayoutChange({});
  };

  const handleResizeDown = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    resizeRef.current = { y: e.clientY, height: canvasHeight };
  };

  const handleResizeMove = (e) => {
    if (!resizeRef.current) return;
    setCanvasHeight(Math.max(200, resizeRef.current.height + (e.clientY - resizeRef.current.y)));
  };

  const handleResizeUp = () => {
    resizeRef.current = null;
  };

  const activeAttendance = attendance.filter((r) => r.state === "will_be_present" || r.state === "present");

  const sections = [
    ...new Set(activeAttendance.map((r) => r.expand?.group_member?.expand?.section?.name).filter(Boolean)),
  ].sort();

  const unplaced = activeAttendance.filter((r) => !positions[r.id]);
  const sidebarItems = selectedSection
    ? unplaced.filter((r) => r.expand?.group_member?.expand?.section?.name === selectedSection)
    : unplaced;
  const placed = activeAttendance.filter((r) => !!positions[r.id]);

  const draggingRecord = draggingId ? activeAttendance.find((r) => r.id === draggingId) : null;
  const draggingFromSidebar = draggingRecord && !positions[draggingId];

  const adminControls = isSessionAdmin ? (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={selectedSection}
        onChange={(e) => setSelectedSection(e.target.value)}
        className="text-sm border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-primary)] rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Alle secties</option>
        {sections.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        onClick={handleReset}
        className="text-sm px-3 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
      >
        Leegmaken
      </button>
    </div>
  ) : null;

  const sidebar = (
    <div className="w-44 flex-shrink-0">
      <p className="text-xs text-[var(--text-secondary)] mb-2">
        Leden ({sidebarItems.length}
        {selectedSection ? ` in ${selectedSection}` : ""})
      </p>

      <div className="flex flex-col gap-1 overflow-y-auto overflow-x-hidden" style={{ maxHeight: canvasHeight }}>
        {sidebarItems.map((record) => (
          <SidebarCard
            key={record.id}
            record={record}
            isAdmin={isSessionAdmin}
            onPlace={handlePlace}
            lastDragEnd={lastDragEnd}
          />
        ))}
        {sidebarItems.length === 0 && (
          <p className="text-xs text-[var(--text-secondary)] italic">Alle leden geplaatst</p>
        )}
      </div>
    </div>
  );

  const canvasArea = (
    <div className={`flex-1 flex flex-col ${modal ? "min-h-0" : ""}`}>
      <div
        ref={setCanvasRef}
        className={`relative w-full rounded-t-xl border border-b-0 transition-colors ${
          isOver && draggingFromSidebar
            ? "border-blue-400 bg-blue-50/40 dark:bg-blue-900/10"
            : "border-[var(--glass-border)] bg-[var(--glass-bg)]"
        }`}
        style={{ height: modal ? undefined : canvasHeight, ...(modal ? { flex: 1 } : {}) }}
      >
        {placed.map((record) => (
          <CanvasCard
            key={record.id}
            record={record}
            position={positions[record.id]}
            isAdmin={isSessionAdmin}
            onRemove={handleRemove}
          />
        ))}
        {placed.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-[var(--text-secondary)]">
              {isSessionAdmin ? "Sleep een lid naar het canvas" : "Geen opstelling ingesteld"}
            </p>
          </div>
        )}
      </div>

      {!modal && isSessionAdmin && (
        <div
          className="w-full h-4 rounded-b-xl border border-[var(--glass-border)] bg-[var(--glass-bg)] cursor-ns-resize flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors select-none"
          onPointerDown={handleResizeDown}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeUp}
          onPointerCancel={handleResizeUp}
        >
          <div className="w-8 h-0.5 rounded-full bg-gray-300 dark:bg-slate-500" />
        </div>
      )}
    </div>
  );

  const content = modal ? (
    <div className="flex flex-col h-full gap-3">
      {adminControls && <div className="flex-shrink-0">{adminControls}</div>}
      <div className="flex gap-4 flex-1 min-h-0">
        {sidebar}
        {canvasArea}
      </div>
    </div>
  ) : (
    <div className="glass-panel rounded-2xl">
      <div className="glass-header px-4 py-3 flex items-center justify-between gap-3">
        <h3 className="text-lg font-medium text-[var(--text-primary)]">Opstelling</h3>
        {adminControls ?? <span className="text-xs text-[var(--text-secondary)]">Alleen-lezen</span>}
      </div>
      <div ref={scrollWrapRef} className="overflow-x-auto">
        <div className="p-4 flex gap-4 min-w-[1000px]">
          {sidebar}
          {canvasArea}
        </div>
      </div>
    </div>
  );

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      {content}
      <DragOverlay dropAnimation={null}>{draggingRecord ? <CardContent record={draggingRecord} /> : null}</DragOverlay>
    </DndContext>
  );
};

export default SessionCanvas;
