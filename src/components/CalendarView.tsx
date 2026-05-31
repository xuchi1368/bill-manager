'use client';

import { useEffect, useState } from 'react';
import { useCategoryIcon } from '@/lib/icon-map';

interface DayData {
  date: string; income: number; expense: number; count: number;
  items: {
    id: string; type: string; amount: number; date: string; note?: string | null;
    category: { name: string; icon: string };
    channel: { name: string };
    splits?: { id: string; categoryId: string; amount: number; category: { name: string; icon: string } }[];
  }[];
}

function heatBg(data: DayData | undefined, maxAbs: number): string {
  if (!data || (data.income === 0 && data.expense === 0)) return '#faf7f2';
  const net = data.income - data.expense;
  const ratio = maxAbs > 0 ? Math.min(Math.abs(net) / maxAbs, 1) : 0;
  const alpha = 0.08 + ratio * 0.37;
  if (net > 0) return `rgba(46,168,122,${alpha.toFixed(2)})`;
  return `rgba(226,92,59,${alpha.toFixed(2)})`;
}

function heatText(data: DayData | undefined): string {
  if (!data || (data.income === 0 && data.expense === 0)) return '#3d342b';
  return data.income - data.expense > 0 ? '#2ea87a' : '#e25c3b';
}

export default function CalendarView() {
  const today = new Date();
  const catIcon = useCategoryIcon();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [days, setDays] = useState<Map<string, DayData>>(new Map());
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const yearMonth = `${year}-${String(month).padStart(2, '0')}`;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar?yearMonth=${yearMonth}`)
      .then(r => r.json())
      .then(data => {
        const m = new Map<string, DayData>();
        (data.days || []).forEach((d: DayData) => m.set(d.date, d));
        setDays(m);
        setSelected(null);
      })
      .finally(() => setLoading(false));
  }, [yearMonth]);

  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr = today.toISOString().split('T')[0];

  function prevMonth() {
    if (month === 1) { setYear(year - 1); setMonth(12); }
    else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(year + 1); setMonth(1); }
    else setMonth(month + 1);
  }

  const weekHeaders = ['日', '一', '二', '三', '四', '五', '六'];
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const allDays = Array.from(days.values());
  const maxAbs = Math.max(...allDays.map(d => Math.abs(d.income - d.expense)), 1);
  const totalIncome = allDays.reduce((s, d) => s + d.income, 0);
  const totalExpense = allDays.reduce((s, d) => s + d.expense, 0);
  const selectedData = selected ? days.get(selected) : null;

  return (
    <div className="card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-6 h-6 flex items-center justify-center rounded-md text-[#6b5d52] hover:text-[#3d342b] hover:bg-[#f5f2ed] transition-colors cursor-pointer text-xs">◀</button>
        <span className="font-semibold text-[#3d342b] text-sm">{year}年{month}月</span>
        <button onClick={nextMonth} disabled={year === today.getFullYear() && month === today.getMonth() + 1}
          className="w-6 h-6 flex items-center justify-center rounded-md text-[#6b5d52] hover:text-[#3d342b] hover:bg-[#f5f2ed] transition-colors disabled:opacity-30 cursor-pointer text-xs">▶</button>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-center gap-4 mb-2 text-[11px]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#2ea87a]" />
          <span className="text-[#6b5d52]">收</span>
          <span className="font-semibold text-[#2ea87a] amount">¥{totalIncome.toLocaleString()}</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#e25c3b]" />
          <span className="text-[#6b5d52]">支</span>
          <span className="font-semibold text-[#e25c3b] amount">¥{totalExpense.toLocaleString()}</span>
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-[3px]">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="rounded-[3px] animate-shimmer" style={{ paddingBottom: '60%' }} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-[3px] mb-[3px]">
            {weekHeaders.map(h => (
              <div key={h} className="text-center text-[11px] text-[#6b5d52] py-0.5">{h}</div>
            ))}
          </div>

          {[0, 1, 2, 3, 4].map(row => {
            const rowCells = cells.slice(row * 7, (row + 1) * 7);
            const hasContent = rowCells.some(c => c !== null);
            if (!hasContent) return null;
            return (
              <div key={row} className="grid grid-cols-7 gap-[3px] mt-[3px]">
                {rowCells.map((day, col) => {
                  if (day === null) return <div key={`e-${row}-${col}`} />;
                  const dateStr = `${yearMonth}-${String(day).padStart(2, '0')}`;
                  const data = days.get(dateStr);
                  const isToday = dateStr === todayStr;
                  const isSelected = selected === dateStr;
                  const bg = heatBg(data, maxAbs);
                  const txt = heatText(data);
                  const isBold = data && Math.abs(data.income - data.expense) > maxAbs * 0.3;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => data && setSelected(isSelected ? null : dateStr)}
                      className={`rounded-[4px] text-[11px] py-[5px] transition-all cursor-pointer
                        ${isToday ? 'ring-2 ring-[#f59e0b] ring-offset-1 z-10' : ''}
                        ${isSelected ? 'ring-2 ring-[#3d342b] ring-offset-1 z-10' : ''}
                        ${!data ? 'cursor-default' : 'hover:scale-110'}
                      `}
                      style={{ background: bg, color: txt, fontWeight: (isToday || isBold) ? 600 : 400 }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </>
      )}

      {/* Selected day detail */}
      {selectedData && (
        <div className="mt-2 border-t border-[#ede6dd] pt-2 animate-slide-up max-h-[120px] overflow-y-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-[#3d342b]">{selected}</span>
            <span className="caption">
              收 <span className="text-[#2ea87a] font-semibold">¥{selectedData.income.toLocaleString()}</span>
              {' '}支 <span className="text-[#e25c3b] font-semibold">¥{selectedData.expense.toLocaleString()}</span>
            </span>
          </div>
          <div className="space-y-1">
            {selectedData.items.map(t => (
                <div key={t.id} className="flex items-center gap-1.5 bg-[#faf7f2] rounded-md px-2 py-1">
                  {catIcon(t.category.icon, t.category.name)}
                  <span className="text-[11px] text-[#3d342b] flex-1 truncate">{t.category.name}{t.note ? ` · ${t.note}` : ''}</span>
                  <span className="caption">{t.channel.name}</span>
                  <span className={`amount text-[11px] font-semibold ${t.type === 'income' ? 'text-[#2ea87a]' : 'text-[#e25c3b]'}`}>
                    {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
          <a href={`/transactions?startDate=${selected}&endDate=${selected}`}
            className="inline-block mt-2 text-[11px] text-[#f59e0b] font-medium hover:underline cursor-pointer"
          >查看当天全部流水 →</a>
        </div>
      )}
    </div>
  );
}
