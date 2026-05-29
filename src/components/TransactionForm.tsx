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

export default function TransactionForm({ onCreated }: { onCreated: () => void }) {
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [channelId, setChannelId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [submitting, setSubmitting] = useState(false);

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
    if (!amount || !categoryId || !channelId) return;
    setSubmitting(true);

    await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, amount: parseFloat(amount), date, note, categoryId, channelId }),
    });

    setAmount('');
    setNote('');
    setSubmitting(false);
    onCreated();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-6">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">📝 记一笔</h3>

      <div className="flex gap-3 mb-3">
        <button
          type="button"
          className={`px-4 py-1.5 rounded-lg text-sm ${type === 'expense' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}
          onClick={() => setType('expense')}
        >
          支出
        </button>
        <button
          type="button"
          className={`px-4 py-1.5 rounded-lg text-sm ${type === 'income' ? 'bg-green-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}
          onClick={() => setType('income')}
        >
          收入
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <input
          type="number"
          step="0.01"
          placeholder="金额"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white"
        >
          <option value="">选择分类</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
        <select
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          required
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white"
        >
          <option value="">选择渠道</option>
          {channels.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white"
        />
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="备注（选填）"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-zinc-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-500 disabled:opacity-50"
        >
          {submitting ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  );
}
