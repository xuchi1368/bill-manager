'use client';

import { useState, useEffect } from 'react';

interface Category { id: string; name: string; icon: string; type: string; }
interface Channel { id: string; name: string; type: string; }

interface EditData {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  categoryId: string;
  channelId: string;
  date: string;
  note: string;
  splits?: { categoryId: string; amount: number }[];
}

export default function TransactionForm({ onCreated, edit, onCancelEdit }: {
  onCreated: () => void;
  edit?: EditData | null;
  onCancelEdit?: () => void;
}) {
  const [type, setType] = useState<'expense' | 'income'>(edit?.type || 'expense');
  const [amount, setAmount] = useState(edit ? String(edit.amount) : '');
  const [categoryId, setCategoryId] = useState(edit?.categoryId || '');
  const [channelId, setChannelId] = useState(edit?.channelId || '');
  const [date, setDate] = useState(edit?.date || new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(edit?.note || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [budgets, setBudgets] = useState<Map<string, { spent: number; limit: number }>>(new Map());
  const [matchInfo, setMatchInfo] = useState<string | null>(null);
  const [isSplit, setIsSplit] = useState(false);
  const [splitParts, setSplitParts] = useState<{ categoryId: string; amount: string }[]>([{ categoryId: '', amount: '' }, { categoryId: '', amount: '' }]);

  useEffect(() => {
    if (edit) {
      setType(edit.type);
      setAmount(String(edit.amount));
      setCategoryId(edit.categoryId);
      setChannelId(edit.channelId);
      setDate(edit.date);
      setNote(edit.note);
      if (edit.splits && edit.splits.length > 0) {
        setIsSplit(true);
        setSplitParts(edit.splits.map(s => ({ categoryId: s.categoryId, amount: String(s.amount) })));
      } else {
        setIsSplit(false);
        setSplitParts([{ categoryId: '', amount: '' }, { categoryId: '', amount: '' }]);
      }
    }
  }, [edit?.id]);

  useEffect(() => {
    fetch(`/api/categories?type=${type}`).then((r) => r.json()).then(setCategories);
  }, [type]);

  useEffect(() => {
    fetch('/api/channels').then((r) => r.json()).then((chs: Channel[]) => {
      setChannels(chs.filter((c) => (type === 'expense' ? c.type === 'payment' : c.type === 'income')));
    });
  }, [type]);

  useEffect(() => {
    fetch('/api/dashboard').then((r) => r.json()).then((d) => {
      const m = new Map<string, { spent: number; limit: number }>();
      (d.budgets || []).forEach((b: { id: string; spent: number; budgetLimit: number }) => {
        m.set(b.id, { spent: b.spent, limit: b.budgetLimit });
      });
      setBudgets(m);
    });
  }, []);

  const inputClass = 'w-full bg-[#f5f2ed] border-0 rounded-[10px] px-3 py-2 text-sm text-[#3d342b] placeholder-[#6b5d52] focus:outline-none focus:ring-2 focus:ring-amber-500/30';

  function resetForm() {
    setAmount(''); setNote(''); setCategoryId(''); setChannelId('');
    setIsSplit(false);
    setSplitParts([{ categoryId: '', amount: '' }, { categoryId: '', amount: '' }]);
    setMatchInfo(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amount || isNaN(amt) || amt <= 0) { alert('请输入有效的金额'); return; }
    if (!channelId) return;
    if (!isSplit && !categoryId) return;
    if (isSplit && splitParts.some(sp => !sp.categoryId || !sp.amount)) return;
    setSubmitting(true);
    setMatchInfo(null);

    const payload = {
      type, amount: parseFloat(amount), date, note, categoryId, channelId,
      ...(isSplit ? { splits: splitParts.map(sp => ({ categoryId: sp.categoryId, amount: parseFloat(sp.amount) })) } : {}),
    };
    if (isSplit) payload.categoryId = splitParts[0]?.categoryId || categoryId;

    if (edit) {
      await fetch(`/api/transactions/${edit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.matchedRuleName) {
        setMatchInfo(`已匹配规则: ${data.matchedRuleName}`);
      }
    }

    if (!edit) {
      resetForm();
      window.dispatchEvent(new CustomEvent('transaction-created'));
    }
    setSubmitting(false);
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#3d342b]">
          {edit ? '编辑记录' : '记一笔'}
        </h3>
        {edit && onCancelEdit && (
          <button type="button" onClick={onCancelEdit} className="text-xs text-[#6b5d52] hover:text-[#3d342b]">
            取消编辑
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setType('expense')}
          className={`flex-1 py-2 rounded-[10px] text-sm font-medium transition-colors ${type === 'expense' ? 'bg-rose-50 text-[#e25c3b]' : 'bg-[#f5f2ed] text-[#6b5d52]'}`}>支出</button>
        <button type="button" onClick={() => setType('income')}
          className={`flex-1 py-2 rounded-[10px] text-sm font-medium transition-colors ${type === 'income' ? 'bg-emerald-50 text-[#2ea87a]' : 'bg-[#f5f2ed] text-[#6b5d52]'}`}>收入</button>
      </div>

      <div className="space-y-3 mb-3">
        <input type="number" step="0.01" placeholder="金额" value={amount} onChange={(e) => setAmount(e.target.value)} required className={inputClass} />

        {!isSplit && (
          <div className="grid grid-cols-2 gap-3">
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className={inputClass}>
              <option value="">选择分类</option>
              {categories.map((c) => (<option key={c.id} value={c.id}>{c.icon} {c.name}</option>))}
            </select>
            <select value={channelId} onChange={(e) => setChannelId(e.target.value)} required className={inputClass}>
              <option value="">选择渠道</option>
              {channels.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
        )}

        <button type="button" onClick={() => setIsSplit(!isSplit)} className={`text-xs transition-colors ${isSplit ? 'text-[#e25c3b]' : 'text-[#6b5d52] hover:text-[#3d342b]'}`}>
          {isSplit ? '✕ 取消拆分' : '+ 拆分记账'}
        </button>

        {isSplit && (
          <div className="space-y-2 animate-slide-up">
            {splitParts.map((sp, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select value={sp.categoryId} onChange={(e) => {
                  const next = [...splitParts];
                  next[i] = { ...next[i], categoryId: e.target.value };
                  setSplitParts(next);
                }} required className={`${inputClass} flex-1`}>
                  <option value="">选择分类</option>
                  {categories.map((c) => (<option key={c.id} value={c.id}>{c.icon} {c.name}</option>))}
                </select>
                <input type="number" step="0.01" placeholder="金额" value={sp.amount} onChange={(e) => {
                  const next = [...splitParts];
                  next[i] = { ...next[i], amount: e.target.value };
                  setSplitParts(next);
                }} required className={`${inputClass} w-28`} />
                {splitParts.length > 2 && (
                  <button type="button" onClick={() => setSplitParts(splitParts.filter((_, j) => j !== i))} className="text-[#6b5d52] hover:text-[#e25c3b] text-sm flex-shrink-0">✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => setSplitParts([...splitParts, { categoryId: '', amount: '' }])} className="text-xs text-[#6b5d52] hover:text-[#3d342b]">
              + 添加分项
            </button>
            {(() => {
              const splitSum = splitParts.reduce((s, sp) => s + (parseFloat(sp.amount) || 0), 0);
              const total = parseFloat(amount) || 0;
              const match = Math.abs(splitSum - total) < 0.01;
              return (
                <div className={`text-xs ${match ? 'text-[#2ea87a]' : 'text-[#e25c3b]'}`}>
                  已分配 ¥{splitSum.toFixed(2)} / ¥{total.toFixed(2)}
                  {!match && <span className="ml-1">（{splitSum > total ? '超出' : '不足'}）</span>}
                </div>
              );
            })()}
            <div className="grid grid-cols-1 gap-3">
              <select value={channelId} onChange={(e) => setChannelId(e.target.value)} required className={inputClass}>
                <option value="">选择渠道</option>
                {channels.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
          </div>
        )}

        {!isSplit && (
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            <input type="text" placeholder="备注（选填）" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
          </div>
        )}
        {isSplit && (
          <div className="grid grid-cols-2 gap-3">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
            <input type="text" placeholder="备注（选填）" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
          </div>
        )}
      </div>

      {matchInfo && (
        <div className="mb-3 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-[8px] px-3 py-1.5 animate-slide-up">
          {matchInfo}
        </div>
      )}

      {budgets.has(categoryId) && (() => {
        const b = budgets.get(categoryId)!;
        const pct = b.limit > 0 ? Math.round((b.spent / b.limit) * 100) : 0;
        const over = b.spent > b.limit;
        return (
          <div className="mb-3 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[#ede6dd] rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${over ? 'bg-[#e25c3b]' : pct >= 80 ? 'bg-amber-500' : 'bg-[#2ea87a]'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
            <span className={`text-xs whitespace-nowrap ${over ? 'text-[#e25c3b]' : pct >= 80 ? 'text-amber-600' : 'text-[#6b5d52]'}`}>
              本月 ¥{b.spent.toLocaleString()} / ¥{b.limit.toLocaleString()}{over ? ' 超支' : ` ${pct}%`}
            </span>
          </div>
        );
      })()}

      <button type="submit" disabled={submitting} className="w-full py-2.5 bg-[#f59e0b] hover:bg-amber-500/90 active:scale-[0.99] text-white font-medium rounded-[10px] text-sm transition-all disabled:opacity-40">
        {submitting ? '保存中...' : edit ? '更新' : '保存'}
      </button>
    </form>
  );
}
