import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";

export default function BoardView({ rotating, controls, children }: { rotating: boolean; controls?: ReactNode; children: ReactNode }) {
  const [angle, setAngle] = useState(0);
  const drag = useRef<{ pointer: number; angle: number } | null>(null);

  function bearing(event: PointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - box.left - box.width / 2;
    const y = event.clientY - box.top - box.height / 2;
    if (Math.hypot(x, y) < 10) return null;
    return Math.atan2(y / box.height, x / box.width) * 180 / Math.PI;
  }

  return <section className="tray" aria-label="Chinese checkers board">
    {controls}
    <div className="disc" style={{ "--angle": angle + "deg" } as CSSProperties}>
      <div className="holes">{children}</div>
      {rotating && <div className="turn-surface" aria-hidden="true"
        onPointerDown={event => {
          if (event.button !== 0 || !event.isPrimary) return;
          const start = bearing(event);
          if (start === null) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          drag.current = { pointer: event.pointerId, angle: start };
        }}
        onPointerMove={event => {
          const current = drag.current;
          if (!current || current.pointer !== event.pointerId) return;
          const end = bearing(event);
          if (end === null) return;
          const delta = end - current.angle;
          current.angle = end;
          setAngle(a => (a + delta + 720) % 360);
        }}
        onLostPointerCapture={() => { drag.current = null; }}
      />}
    </div>
    {rotating && <label className="angle-control">Board angle
      <input type="range" min="0" max="360" value={Math.round(angle)}
        onChange={event => setAngle(Number(event.target.value))}/>
      <output>{Math.round(angle)}°</output>
    </label>}
  </section>;
}
