'use client';

import { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
  icon: string;
  type: string;
}

interface Channel {
  id: string;
  name: string;
  type: string;
}

export default function RecurringRuleForm({ onCreated }: { onCreated: () => void }) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [frequency, setFrequency] = useState('monthly');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [nextDueDate, setNextDueDate] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    fetch(`/api/categories?type=${type}`).then((r) => r.json()).then(setCategories);
  }, [type]);

  useEffect(() => {
    fetch('/api/channels').then((r) => r.json()).then((chs: Channel[]) => {
      setChannels(chs.filter((c) => (type === 'expense' ? c.type === 'payment' : c.type === 'income')));
    });
  }, [type]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/recurring-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, amount: parseFloat(amount), type, frequency, dayOfMonth: parseInt(dayOfMonth), nextDueDate, categoryId, channelId }),
    });
    setName(''); setAmount(''); setNextDueDate('');
    onCreated();
  }

  const inputClass = 'bg-[#f5f2ed] border-0 rounded-[10px] px-3.5 py-2 text-sm text-[#3d342b] placeholder-[#6b5d52] focus:outline-none focus:ring-2 focus:ring-amber-500/30';

  return (
    <form onSubmit={handleSubmit} className="card p-5 mb-6">
      <h3 className="text-sm font-semibold text-[#3d342b] mb-4">➕ 新建周期规则</h3>

      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setType('expense')}
          className={`flex-1 py-2 rounded-[10px] text-sm font-medium transition-colors ${type === 'expense' ? 'bg-rose-50 text-[#e25c3b]' : 'bg-[#f5f2ed] text-[#6b5d52]'}`}>支出</button>
        <button type="button" onClick={() => setType('income')}
          className={`flex-1 py-2 rounded-[10px] text-sm font-medium transition-colors ${type === 'income' ? 'bg-emerald-50 text-[#2ea87a]' : 'bg-[#f5f2ed] text-[#6b5d52]'}`}>收入</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
        <input type="text" placeholder="名称（如：房租）" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
        <input type="number" step="0.01" placeholder="金额" value={amount} onChange={(e) => setAmount(e.target.value)} required className={inputClass} />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className={inputClass}>
          <option value="">分类</option>
          {categories.map((c) => (<option key={c.id} value={c.id}>{c.icon} {c.name}</option>))}
        </select>
        <select value={channelId} onChange={(e) => setChannelId(e.target.value)} required className={inputClass}>
          <option value="">渠道</option>
          {channels.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputClass}>
          <option value="daily">每天</option>
          <option value="weekly">每周</option>
          <option value="monthly">每月</option>
          <option value="yearly">每年</option>
        </select>
        <input type="date" placeholder="下次到期日" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} required className={inputClass} />
      </div>

      {frequency === 'monthly' && (
        <div className="mb-3 flex items-center gap-2">
          <label className="text-xs text-[#6b5d52]">每月第几天</label>
          <input type="number" min="1" max="31" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className={`${inputClass} w-20`} />
        </div>
      )}

      <button type="submit" className="px-6 py-2 bg-[#f59e0b] hover:bg-amber-500/90 active:scale-95 text-white font-medium rounded-[10px] text-sm transition-all">
        保存
      </button>
    </form>
  );
}
