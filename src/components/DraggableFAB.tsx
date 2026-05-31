'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus } from 'lucide-react';

export default function DraggableFAB({ onClick }: { onClick: () => void }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const moved = useRef(false);
  const start = useRef({ x: 0, y: 0, mx: 0, my: 0 });

  useEffect(() => {
    setPos({ x: window.innerWidth - 72, y: window.innerHeight - 140 });
  }, []);

  const onStart = useCallback((cx: number, cy: number) => {
    setDragging(true);
    moved.current = false;
    start.current = { x: pos.x, y: pos.y, mx: cx, my: cy };
  }, [pos]);

  const onEnd = useCallback(() => {
    setDragging(false);
    setPos(p => ({
      x: p.x < window.innerWidth / 2 ? 16 : window.innerWidth - 72,
      y: p.y,
    }));
  }, []);

  // Only attach global listeners while dragging
  useEffect(() => {
    if (!dragging) return;

    const mm = (e: MouseEvent) => {
      const dx = e.clientX - start.current.mx;
      const dy = e.clientY - start.current.my;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved.current = true;
      setPos({
        x: Math.max(8, Math.min(window.innerWidth - 64, start.current.x + dx)),
        y: Math.max(8, Math.min(window.innerHeight - 64, start.current.y + dy)),
      });
    };

    const tm = (e: TouchEvent) => {
      e.preventDefault();
      const t = e.touches[0];
      const dx = t.clientX - start.current.mx;
      const dy = t.clientY - start.current.my;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved.current = true;
      setPos({
        x: Math.max(8, Math.min(window.innerWidth - 64, start.current.x + dx)),
        y: Math.max(8, Math.min(window.innerHeight - 64, start.current.y + dy)),
      });
    };

    const mu = () => onEnd();
    const tu = () => onEnd();

    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    window.addEventListener('touchmove', tm, { passive: false });
    window.addEventListener('touchend', tu);
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('touchend', tu);
    };
  }, [dragging, onEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button
      onClick={() => { if (!moved.current) onClick(); }}
      onMouseDown={e => { e.preventDefault(); onStart(e.clientX, e.clientY); }}
      onTouchStart={e => { const t = e.touches[0]; onStart(t.clientX, t.clientY); }}
      className="fixed z-40 w-14 h-14 bg-[#f59e0b] active:scale-95 text-white rounded-2xl shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
      style={{
        left: pos.x,
        top: pos.y,
        transition: 'left 0.25s ease',
      }}
      title="快速记账（可拖拽）"
    >
      <Plus size={28} strokeWidth={2.5} />
    </button>
  );
}
