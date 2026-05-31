'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const DAYS = ['一', '二', '三', '四', '五', '六', '日'];

export default function DatePicker({ value, onChange, className = '', placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const date = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(date.getFullYear());
  const [viewMonth, setViewMonth] = useState(date.getMonth());

  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const weeks: (number | null)[][] = [];
  let day = 1;
  for (let w = 0; w < 6; w++) {
    const week: (number | null)[] = [];
    for (let d = 0; d < 7; d++) {
      if (w === 0 && d < (firstDay === 0 ? 6 : firstDay - 1)) {
        week.push(null);
      } else if (day > daysInMonth) {
        week.push(null);
      } else {
        week.push(day++);
      }
    }
    weeks.push(week);
    if (day > daysInMonth) break;
  }

  function select(dom: number) {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(dom).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  }

  const selected = value || '';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 bg-[#f5f2ed] rounded-[10px] px-3 py-1.5 text-xs text-[#3d342b] w-full focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer ${className}`}
      >
        <Calendar size={14} strokeWidth={1.5} className="text-[#6b5d52] shrink-0" />
        <span className={value ? 'text-[#3d342b]' : 'text-[#6b5d52]'}>
          {value || placeholder || '选择日期'}
        </span>
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 z-50 bg-white border border-[#ede6dd] rounded-xl shadow-lg p-3 w-[248px] animate-scale-in">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
                else setViewMonth(viewMonth - 1);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f2ed] text-[#6b5d52] transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} strokeWidth={2} />
            </button>
            <span className="text-[13px] font-semibold text-[#3d342b]">
              {viewYear}年{viewMonth + 1}月
            </span>
            <button
              type="button"
              onClick={() => {
                if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
                else setViewMonth(viewMonth + 1);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f5f2ed] text-[#6b5d52] transition-colors cursor-pointer"
            >
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] text-[#6b5d52] font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Day grid */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7">
              {week.map((d, di) => {
                if (d === null) return <div key={di} />;
                const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const isToday = ds === today;
                const isSelected = ds === selected;
                return (
                  <button
                    key={di}
                    type="button"
                    onClick={() => select(d)}
                    className={`w-8 h-8 text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center
                      ${isSelected
                        ? 'bg-[#f59e0b] text-white font-semibold shadow-sm'
                        : isToday
                          ? 'bg-amber-50 text-[#f59e0b] font-semibold'
                          : 'text-[#3d342b] hover:bg-[#f5f2ed]'
                      }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
