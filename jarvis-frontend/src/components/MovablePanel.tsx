import { CSSProperties, KeyboardEvent, PointerEvent, ReactNode, useEffect, useRef, useState } from "react";

type Point = { x: number; y: number };

type MovablePanelProps = {
  children: ReactNode;
  className: string;
  defaultPosition: Point;
  id: string;
  label: string;
};

const storagePrefix = "jarvis.panel-layout.v1.";

function clamp(point: Point) {
  return {
    x: Math.max(8, Math.min(point.x, window.innerWidth - 56)),
    y: Math.max(8, Math.min(point.y, window.innerHeight - 56)),
  };
}

function loadPosition(id: string, fallback: Point) {
  try {
    const saved = window.localStorage.getItem(`${storagePrefix}${id}`);
    if (!saved) return fallback;
    const position = JSON.parse(saved) as Point;
    return Number.isFinite(position.x) && Number.isFinite(position.y) ? clamp(position) : fallback;
  } catch {
    return fallback;
  }
}

export function MovablePanel({ children, className, defaultPosition, id, label }: MovablePanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const dragOrigin = useRef<Point | null>(null);
  const [position, setPosition] = useState(() => loadPosition(id, defaultPosition));
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    const onResize = () => setPosition((current) => clamp(current));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function fixPosition() {
    try {
      window.localStorage.setItem(`${storagePrefix}${id}`, JSON.stringify(position));
    } catch {
      // Storage can be unavailable in private browsing; the fixed position still works for this session.
    }
    setMoving(false);
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return; // Only left click
    const target = event.target as HTMLElement;
    if (target.closest('button, input, select, textarea, .panel-context-menu')) return;

    dragOrigin.current = { x: event.clientX - position.x, y: event.clientY - position.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    setMoving(true);
  }

  function drag(event: PointerEvent<HTMLDivElement>) {
    if (!moving || !dragOrigin.current) return;
    setPosition(clamp({ x: event.clientX - dragOrigin.current.x, y: event.clientY - dragOrigin.current.y }));
  }

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    if (!moving) return;
    dragOrigin.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    fixPosition();
  }

  function nudge(event: KeyboardEvent<HTMLDivElement>) {
    const amount = event.shiftKey ? 24 : 8;
    const adjustment: Record<string, Point> = {
      ArrowDown: { x: 0, y: amount },
      ArrowLeft: { x: -amount, y: 0 },
      ArrowRight: { x: amount, y: 0 },
      ArrowUp: { x: 0, y: -amount },
    };
    const delta = adjustment[event.key];
    if (!delta) return;
    
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea')) return;
    
    event.preventDefault();
    setPosition((current) => {
        const newPos = clamp({ x: current.x + delta.x, y: current.y + delta.y });
        try {
            window.localStorage.setItem(`${storagePrefix}${id}`, JSON.stringify(newPos));
        } catch {}
        return newPos;
    });
  }

  return (
    <div
      ref={panelRef}
      tabIndex={0}
      className={`movable-panel ${className} ${moving ? "is-moving" : ""}`}
      style={{ "--panel-x": `${position.x}px`, "--panel-y": `${position.y}px`, cursor: moving ? "grabbing" : "grab" } as CSSProperties}
      onPointerDown={startDrag}
      onPointerMove={drag}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={nudge}
      aria-label={`${label}. Drag to move or use arrow keys.`}
    >
      {children}
    </div>
  );
}
