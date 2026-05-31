'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import DatePicker from './DatePicker';

import { useCategoryIcon } from '@/lib/icon-map';

interface Category { id: string; name: string; icon: string; type: string; }
interface Channel { id: string; name: string; type: string; }

const STORAGE_KEY = 'bill-quick-preferences';

function loadPrefs(): { channelId: string; type: 'expense' | 'income' } {
  if (typeof window === 'undefined') return { channelId: '', type: 'expense' };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { channelId: '', type: 'expense' };
}

function savePrefs(p: { channelId: string; type: 'expense' | 'income' }) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

export default function QuickAddPanel({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const [step, setStep] = useState<'amount' | 'category' | 'done'>('amount');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [budgetBar, setBudgetBar] = useState<{ spent: number; limit: number } | null>(null);

  const amountRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);
  const catIcon = useCategoryIcon();

  // Init defaults
  useEffect(() => {
    const prefs = loadPrefs();
    setType(prefs.type);
    setDate(new Date().toISOString().slice(0, 10));
    // Load channels first, then apply saved preference
    fetch('/api/channels').then(r => r.json()).then((chs: Channel[]) => {
      const filtered = chs.filter(c => prefs.type === 'expense' ? c.type === 'payment' : c.type === 'income');
      setChannels(filtered);
      if (prefs.channelId && filtered.some(c => c.id === prefs.channelId)) {
        setChannelId(prefs.channelId);
      } else if (filtered.length > 0) {
        setChannelId(filtered[0].id);
      }
    });
  }, []);

  // Load categories when type changes
  useEffect(() => {
    fetch(`/api/categories?type=${type}`).then(r => r.json()).then(setCategories);
  }, [type]);

  // Load budget info when category selected
  useEffect(() => {
    if (!categoryId) { setBudgetBar(null); return; }
    fetch('/api/dashboard').then(r => r.json()).then(d => {
      const budgets: Map<string, { spent: number; limit: number }> = new Map();
      (d.budgets || []).forEach((b: { id: string; spent: number; budgetLimit: number }) => {
        budgets.set(b.id, { spent: b.spent, limit: b.budgetLimit });
      });
      if (budgets.has(categoryId)) setBudgetBar(budgets.get(categoryId)!);
      else setBudgetBar(null);
    });
  }, [categoryId]);

  // Auto-focus
  useEffect(() => {
    if (step === 'amount') amountRef.current?.focus();
    if (step === 'category') showNote && noteRef.current?.focus();
  }, [step, showNote]);

  // Globally common categories (shown first, rest under "more")
  const topCategories = categories.slice(0, 8);
  const moreCategories = categories.slice(8);

  const handleAmountKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && amount && parseFloat(amount) > 0) {
      e.preventDefault();
      setStep('category');
    }
  }, [amount]);

  const selectCategory = useCallback((id: string) => {
    setCategoryId(id);
  }, []);

  async function submit() {
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0 || !channelId || !categoryId) return;
    setSubmitting(true);

    const payload = {
      type, amount: parseFloat(amount), date, note, categoryId, channelId,
    };

    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    savePrefs({ channelId, type });
    window.dispatchEvent(new CustomEvent('transaction-created'));

    setStep('done');
    setTimeout(() => {
      onCreated();
      onClose();
    }, 600);
  }

  // Animate checkmark then close
  if (step === 'done') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[1px] animate-fade-in">
        <div className="bg-white rounded-2xl p-8 shadow-xl text-center animate-scale-in">
          <div className="text-5xl mb-3 animate-slide-up">✅</div>
          <p className="text-[#3d342b] font-semibold">已记录</p>
          <p className="text-sm text-[#6b5d52] mt-1">¥{parseFloat(amount).toLocaleString()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/20 backdrop-blur-[1px] animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 sm:p-6 shadow-xl animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[#3d342b]">📝 记一笔</h3>
          <div className="flex gap-1">
            <button onClick={() => { setType('expense'); const prefs = loadPrefs(); prefs.type = 'expense'; savePrefs(prefs); }}
              className={`px-3 py-1 rounded-[8px] text-xs font-medium transition-colors ${type === 'expense' ? 'bg-rose-50 text-[#e25c3b]' : 'text-[#6b5d52] hover:bg-[#f5f2ed]'}`}>支出</button>
            <button onClick={() => { setType('income'); const prefs = loadPrefs(); prefs.type = 'income'; savePrefs(prefs); }}
              className={`px-3 py-1 rounded-[8px] text-xs font-medium transition-colors ${type === 'income' ? 'bg-emerald-50 text-[#2ea87a]' : 'text-[#6b5d52] hover:bg-[#f5f2ed]'}`}>收入</button>
          </div>
        </div>

        {/* Step 1: Amount */}
        <div className="mb-4">
          <input
            ref={amountRef}
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={handleAmountKey}
            className="w-full text-4xl font-bold text-[#3d342b] bg-transparent border-b-2 border-[#ede6dd] focus:border-[#f59e0b] outline-none pb-2 transition-colors placeholder-[#d6cec4]"
          />
        </div>

        {/* Step 2: Category Grid */}
        <div className="mb-4">
          <div className="text-xs text-[#6b5d52] mb-2">分类</div>
          <div className="grid grid-cols-4 gap-2">
            {topCategories.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => selectCategory(c.id)}
                className={`flex flex-col items-center py-2.5 px-1 rounded-xl transition-all text-center ${
                  categoryId === c.id
                    ? 'bg-[#fef3c7] ring-2 ring-[#f59e0b] ring-offset-1'
                    : 'bg-[#f5f2ed] hover:bg-[#ede6dd]'
                }`}
              >
                {catIcon(c.icon, c.name)}
                <span className="text-[10px] text-[#3d342b] mt-1 leading-tight">{c.name}</span>
              </button>
            ))}
            {moreCategories.length > 0 && (
              <button
                type="button"
                onClick={() => selectCategory(moreCategories[0]?.id || '')}
                className={`flex flex-col items-center py-2.5 px-1 rounded-xl transition-all text-center ${
                  moreCategories.some(c => c.id === categoryId)
                    ? 'bg-[#fef3c7] ring-2 ring-[#f59e0b] ring-offset-1'
                    : 'bg-[#f5f2ed] hover:bg-[#ede6dd]'
                }`}
              >
                <span className="text-xl">⋯</span>
                <span className="text-[10px] text-[#6b5d52] mt-1 leading-tight">更多</span>
              </button>
            )}
          </div>
          {/* Expand more categories */}
          {moreCategories.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {moreCategories.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCategory(c.id)}
                  className={`flex flex-col items-center py-2.5 px-1 rounded-xl transition-all text-center ${
                    categoryId === c.id
                      ? 'bg-[#fef3c7] ring-2 ring-[#f59e0b] ring-offset-1'
                      : 'bg-[#f5f2ed] hover:bg-[#ede6dd]'
                  }`}
                >
                  {catIcon(c.icon, c.name)}
                  <span className="text-[10px] text-[#3d342b] mt-1 leading-tight">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Budget bar */}
        {budgetBar && (
          <div className="mb-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[#ede6dd] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${budgetBar.spent > budgetBar.limit ? 'bg-[#e25c3b]' : (budgetBar.spent / budgetBar.limit) >= 0.8 ? 'bg-amber-500' : 'bg-[#2ea87a]'}`}
                style={{ width: `${Math.min((budgetBar.spent / budgetBar.limit) * 100, 100)}%` }}
              />
            </div>
            <span className={`text-[11px] whitespace-nowrap ${budgetBar.spent > budgetBar.limit ? 'text-[#e25c3b]' : 'text-[#6b5d52]'}`}>
              已用 ¥{budgetBar.spent.toLocaleString()} / ¥{budgetBar.limit.toLocaleString()}
            </span>
          </div>
        )}

        {/* Smart defaults bar */}
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-[#f5f2ed] rounded-[10px] text-xs">
          <span className="text-[#6b5d52]">📅</span>
          <DatePicker value={date} onChange={setDate} className="flex-1" />
          <span className="text-[#ede6dd]">|</span>
          <span className="text-[#6b5d52]">💳</span>
          <select value={channelId} onChange={e => setChannelId(e.target.value)}
            className="bg-transparent text-[#3d342b] outline-none text-xs flex-1 min-w-0">
            {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <span className="text-[#ede6dd]">|</span>
          {showNote ? (
            <input ref={noteRef} type="text" placeholder="备注" value={note} onChange={e => setNote(e.target.value)}
              className="bg-transparent text-[#3d342b] outline-none text-xs w-20" />
          ) : (
            <button type="button" onClick={() => setShowNote(true)} className="text-[#f59e0b] whitespace-nowrap">+ 备注</button>
          )}
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={submitting || !amount || !categoryId || !channelId}
          className="w-full py-3 bg-[#f59e0b] hover:bg-amber-500/90 active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100 text-white font-semibold rounded-xl text-sm transition-all"
        >
          {submitting ? '...' : '✓ 记一笔'}
        </button>
      </div>
    </div>
  );
}
