import { useRef, useState, useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/apiClient';

const RADIUS = 72;
const DOT_R = 13;
const MAX_DIST = RADIUS - DOT_R - 4;
const MAX_SPEED = 178;
const THROTTLE_MS = 80;
const ROLL_TRACK_W = 144;
const ROLL_THUMB_D = 24;
const ROLL_TRACK_H = 28;
const ROLL_MAX = ROLL_TRACK_W / 2 - ROLL_THUMB_D / 2;

export default function PtzJoystick({ cam }) {
  const [dotPos, setDotPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [speed, setSpeed] = useState(30);
  const [rollPos, setRollPos] = useState(0);
  const [isRolling, setIsRolling] = useState(false);

  const containerRef = useRef(null);
  const rollTrackRef = useRef(null);
  const dragging = useRef(false);
  const rolling = useRef(false);
  const lastSent = useRef(0);
  const rollLastSent = useRef(0);

  useEffect(() => {
    apiClient.ptzGetZoom(cam.ip)
      .then(res => setZoom(res.data.ratio ?? 1.0))
      .catch(() => {});
  }, [cam.ip]);

  const clampToCircle = (dx, dy) => {
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= MAX_DIST) return { x: dx, y: dy };
    return { x: (dx / dist) * MAX_DIST, y: (dy / dist) * MAX_DIST };
  };

  const sendPtz = useCallback(async (dx, dy, stop = false) => {
    const now = Date.now();
    if (!stop && now - lastSent.current < THROTTLE_MS) return;
    lastSent.current = now;
    const factor = speed / 100;
    const yaw = stop ? 0 : Math.round((dx / MAX_DIST) * MAX_SPEED * factor);
    const pitch = stop ? 0 : Math.round((dy / MAX_DIST) * MAX_SPEED * factor);
    try {
      await apiClient.ptzGimbalControl(cam.ip, { stop, pitch, yaw, roll: 0 });
    } catch {}
  }, [cam.ip, speed]);

  const sendRoll = useCallback(async (pos, stop = false) => {
    const now = Date.now();
    if (!stop && now - rollLastSent.current < THROTTLE_MS) return;
    rollLastSent.current = now;
    const factor = speed / 100;
    const roll = stop ? 0 : Math.round((pos / ROLL_MAX) * MAX_SPEED * factor);
    try {
      await apiClient.ptzGimbalControl(cam.ip, { stop, pitch: 0, yaw: 0, roll });
    } catch {}
  }, [cam.ip, speed]);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const clamped = clampToCircle(e.clientX - cx, e.clientY - cy);
      setDotPos(clamped);
      sendPtz(clamped.x, clamped.y, false);
    };

    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      setIsDragging(false);
      setDotPos({ x: 0, y: 0 });
      sendPtz(0, 0, true);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [sendPtz]);

  const handleRollMouseDown = useCallback((e) => {
    e.preventDefault();
    rolling.current = true;
    setIsRolling(true);
  }, []);

  useEffect(() => {
    const onRollMove = (e) => {
      if (!rolling.current || !rollTrackRef.current) return;
      const rect = rollTrackRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const clamped = Math.max(-ROLL_MAX, Math.min(ROLL_MAX, e.clientX - cx));
      setRollPos(clamped);
      sendRoll(clamped, false);
    };

    const onRollUp = () => {
      if (!rolling.current) return;
      rolling.current = false;
      setIsRolling(false);
      setRollPos(0);
      sendRoll(0, true);
    };

    window.addEventListener('mousemove', onRollMove);
    window.addEventListener('mouseup', onRollUp);
    return () => {
      window.removeEventListener('mousemove', onRollMove);
      window.removeEventListener('mouseup', onRollUp);
    };
  }, [sendRoll]);

  const handleZoom = async (delta) => {
    const next = parseFloat(Math.max(1.0, Math.min(12.0, zoom + delta)).toFixed(1));
    setZoom(next);
    try {
      await apiClient.ptzSetZoom(cam.ip, next);
    } catch {}
  };

  return (
    <div className="flex flex-col items-center gap-3 pt-3 border-t border-zinc-700 mt-2">
      <p className="text-xs text-zinc-500 uppercase tracking-widest">PTZ Control</p>

      {/* Joystick */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className="relative rounded-full bg-zinc-900 border border-zinc-600 select-none"
        style={{
          width: RADIUS * 2,
          height: RADIUS * 2,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <div className="absolute inset-0 flex items-center pointer-events-none">
          <div className="w-full h-px bg-zinc-700" />
        </div>
        <div className="absolute inset-0 flex justify-center pointer-events-none">
          <div className="h-full w-px bg-zinc-700" />
        </div>
        <div
          className="absolute rounded-full border border-zinc-700 pointer-events-none"
          style={{
            width: MAX_DIST * 2,
            height: MAX_DIST * 2,
            left: RADIUS - MAX_DIST,
            top: RADIUS - MAX_DIST,
          }}
        />
        <div
          className="absolute rounded-full bg-white shadow-lg pointer-events-none"
          style={{
            width: DOT_R * 2,
            height: DOT_R * 2,
            left: RADIUS + dotPos.x - DOT_R,
            top: RADIUS + dotPos.y - DOT_R,
            transition: isDragging ? 'none' : 'left 0.12s ease, top 0.12s ease',
          }}
        />
      </div>

      {/* Roll Slider */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs text-zinc-500 uppercase tracking-widest">Roll</span>
        <div
          ref={rollTrackRef}
          onMouseDown={handleRollMouseDown}
          className="relative bg-zinc-900 border border-zinc-600 rounded-full select-none flex items-center"
          style={{ width: ROLL_TRACK_W, height: ROLL_TRACK_H, cursor: isRolling ? 'grabbing' : 'grab' }}
        >
          <div className="absolute left-1/2 h-full w-px bg-zinc-700 pointer-events-none" style={{ transform: 'translateX(-0.5px)' }} />
          <div
            className="absolute rounded-full bg-white shadow-lg pointer-events-none"
            style={{
              width: ROLL_THUMB_D,
              height: ROLL_THUMB_D,
              left: ROLL_TRACK_W / 2 + rollPos - ROLL_THUMB_D / 2,
              top: (ROLL_TRACK_H - ROLL_THUMB_D) / 2,
              transition: isRolling ? 'none' : 'left 0.12s ease',
            }}
          />
        </div>
      </div>

      {/* Speed Slider */}
      <div className="flex flex-col items-center gap-1" style={{ width: ROLL_TRACK_W }}>
        <div className="flex justify-between w-full">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">Speed</span>
          <span className="text-xs text-zinc-400 tabular-nums">{speed}%</span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          value={speed}
          onChange={e => setSpeed(Number(e.target.value))}
          className="w-full accent-white"
        />
      </div>

      {/* Zoom */}
      <div className="flex items-center gap-2">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => handleZoom(-0.1)}
          className="w-7 h-7 rounded bg-zinc-700 text-white text-sm hover:bg-zinc-600 flex items-center justify-center leading-none"
        >−</button>
        <span className="text-xs text-zinc-400 w-14 text-center tabular-nums">
          {zoom.toFixed(1)}× zoom
        </span>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => handleZoom(+0.1)}
          className="w-7 h-7 rounded bg-zinc-700 text-white text-sm hover:bg-zinc-600 flex items-center justify-center leading-none"
        >+</button>
      </div>
    </div>
  );
}
