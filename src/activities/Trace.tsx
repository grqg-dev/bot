import { useCallback, useEffect, useRef, useState } from 'react';
import { audioService } from '../audio/AudioService';
import { INSTRUCTIONS } from '../audio/instructions';
import { RepeatButton, useActivityInstruction } from './activityUtils';

interface TraceProps {
  sound: string;
  onSuccess: () => void;
}

function getLetterPath(letter: string, w: number, h: number): { x: number; y: number }[] {
  const cx = w / 2;
  const cy = h / 2;
  const size = Math.min(w, h) * 0.35;
  const points: { x: number; y: number }[] = [];

  const addLine = (x1: number, y1: number, x2: number, y2: number, steps = 20) => {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
    }
  };

  switch (letter.toLowerCase()) {
    case 'o':
    case 'c':
      for (let a = 0; a <= Math.PI * 2; a += 0.15) {
        points.push({ x: cx + Math.cos(a) * size, y: cy + Math.sin(a) * size });
      }
      break;
    case 's':
      for (let a = 0; a <= Math.PI * 1.5; a += 0.12) {
        const r = size * (0.8 + 0.2 * Math.sin(a * 2));
        points.push({ x: cx + Math.cos(a + Math.PI) * r, y: cy + Math.sin(a + Math.PI) * r * 0.7 });
      }
      break;
    case 'a':
      addLine(cx, cy + size, cx - size * 0.8, cy - size);
      addLine(cx - size * 0.8, cy - size, cx + size * 0.8, cy - size);
      addLine(cx - size * 0.4, cy, cx + size * 0.4, cy);
      break;
    case 't':
      addLine(cx, cy - size, cx, cy + size);
      addLine(cx - size * 0.7, cy - size * 0.5, cx + size * 0.7, cy - size * 0.5);
      break;
    case 'p':
      addLine(cx - size * 0.5, cy + size, cx - size * 0.5, cy - size);
      for (let a = -Math.PI / 2; a <= Math.PI / 2; a += 0.15) {
        points.push({
          x: cx - size * 0.5 + Math.cos(a) * size * 0.6,
          y: cy - size * 0.3 + Math.sin(a) * size * 0.6,
        });
      }
      break;
    case 'i':
      addLine(cx, cy - size, cx, cy + size);
      points.push({ x: cx, y: cy - size - 20 });
      break;
    case 'n':
      addLine(cx - size * 0.6, cy + size, cx - size * 0.6, cy - size);
      addLine(cx - size * 0.6, cy - size, cx + size * 0.6, cy + size);
      addLine(cx + size * 0.6, cy + size, cx + size * 0.6, cy - size);
      break;
  case 'm':
      addLine(cx - size * 0.8, cy + size, cx - size * 0.8, cy - size);
      addLine(cx - size * 0.8, cy - size, cx, cy);
      addLine(cx, cy, cx + size * 0.8, cy - size);
      addLine(cx + size * 0.8, cy - size, cx + size * 0.8, cy + size);
      break;
    case 'd':
      addLine(cx - size * 0.5, cy + size, cx - size * 0.5, cy - size);
      for (let a = -Math.PI / 2; a <= Math.PI / 2; a += 0.15) {
        points.push({
          x: cx - size * 0.5 + Math.cos(a) * size * 0.7,
          y: cy + Math.sin(a) * size * 0.7,
        });
      }
      break;
    default:
      addLine(cx - size, cy, cx + size, cy);
      addLine(cx + size, cy, cx + size, cy + size * 1.5);
      addLine(cx + size, cy + size * 1.5, cx - size, cy + size * 1.5);
      addLine(cx - size, cy + size * 1.5, cx - size, cy);
      break;
  }

  return points;
}

export function Trace({ sound, onSuccess }: TraceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathRef = useRef<{ x: number; y: number }[]>([]);
  const coveredRef = useRef<Set<number>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const completedRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const speak = useCallback(() => {
    audioService.speakText(INSTRUCTIONS.traceTheLetter);
  }, []);

  useActivityInstruction(speak);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const w = rect.width;
    const h = rect.height;
    pathRef.current = getLetterPath(sound, w, h);

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#c5dff0';
    ctx.lineWidth = 24;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pathRef.current.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    ctx.fillStyle = '#4a90d9';
    ctx.font = `bold ${Math.min(w, h) * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.globalAlpha = 0.15;
    ctx.fillText(sound, w / 2, h / 2);
    ctx.globalAlpha = 1;
  }, [sound]);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setShowHint(true), 4000);
  }, []);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    if (!showHint) return;
    const interval = setInterval(() => {
      setHintIndex((i) => (i + 1) % Math.max(pathRef.current.length, 1));
    }, 80);
    return () => clearInterval(interval);
  }, [showHint]);

  const checkComplete = useCallback(async () => {
    if (completedRef.current) return;
    const total = pathRef.current.length;
    const covered = coveredRef.current.size;
    if (total > 0 && covered / total >= 0.8) {
      completedRef.current = true;
      setShowHint(false);
      await audioService.speakClip(`sound_${sound}`);
      onSuccess();
    }
  }, [sound, onSuccess]);

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas || completedRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const tolerance = 30;

      pathRef.current.forEach((p, i) => {
        const dist = Math.hypot(p.x - x, p.y - y);
        if (dist < tolerance) coveredRef.current.add(i);
      });

      const ctx = canvas.getContext('2d')!;
      ctx.strokeStyle = '#4caf50';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      const covered = [...coveredRef.current].sort((a, b) => a - b);
      if (covered.length > 1) {
        ctx.beginPath();
        covered.forEach((idx, i) => {
          const p = pathRef.current[idx];
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      }

      setShowHint(false);
      resetIdleTimer();
      void checkComplete();
    },
    [checkComplete, resetIdleTimer],
  );

  const hintPoint = showHint && pathRef.current[hintIndex];

  return (
    <>
      <div className="activity-letter" aria-hidden="true">
        {sound}
      </div>
      <div className="trace-canvas-wrap">
        <canvas
          ref={canvasRef}
          className="trace-canvas"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            handlePointerMove(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (e.buttons > 0) handlePointerMove(e.clientX, e.clientY);
          }}
        />
        {hintPoint && (
          <span
            className="trace-hint"
            style={{ left: hintPoint.x - 20, top: hintPoint.y - 20 }}
          >
            👆
          </span>
        )}
      </div>
      <RepeatButton onRepeat={speak} />
    </>
  );
}
