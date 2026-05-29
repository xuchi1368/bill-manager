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

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-6">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">➕ 新建周期规则</h3>
      <div className="flex gap-3 mb-3">
        <button type="button" className={`px-4 py-1.5 rounded-lg text-sm ${type === 'expense' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'}`} onClick={() => setType('expense')}>支出</button>
        <button type="button" className={`px-4 py-1.5 rounded-lg text-sm ${type === 'income' ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400'}`} onClick={() => setType('income')}>收入</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
        <input type="text" placeholder="名称（如：房租）" value={name} onChange={(e) => setName(e.target.value)} required className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500" />
        <input type="number" step="0.01" placeholder="金额" value={amount} onChange={(e) => setAmount(e.target.value)} required className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500" />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white">
          <option value="">分类</option>
          {categories.map((c) => (<option key={c.id} value={c.id}>{c.icon} {c.name}</option>))}
        </select>
        <select value={channelId} onChange={(e) => setChannelId(e.target.value)} required className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white">
          <option value="">渠道</option>
          {channels.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white">
          <option value="daily">每天</option>
          <option value="weekly">每周</option>
          <option value="monthly">每月</option>
          <option value="yearly">每年</option>
        </select>
        <input type="date" placeholder="下次到期日" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} required className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white" />
      </div>
      {frequency === 'monthly' && (
        <div className="mb-3">
          <label className="text-xs text-zinc-500 mr-2">每月第几天</label>
          <input type="number" min="1" max="31" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white w-20" />
        </div>
      )}
      <button type="submit" className="px-6 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500">保存</button>
    </form>
  );
}
