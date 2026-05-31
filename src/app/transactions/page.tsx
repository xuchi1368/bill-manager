'use client';

import { useEffect, useState, useCallback } from 'react';
import PageTransition from '@/components/PageTransition';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';

interface Transaction {
  id: string; type: string; amount: number; date: string;
  note?: string | null;
  categoryId: string;
  channelId: string;
  category: { name: string; icon: string };
  channel: { name: string };
  splits?: { id: string; categoryId: string; amount: number; category: { name: string; icon: string } }[];
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const load = useCallback(() => {
    const params = new URLSearchParams();
    params.set('limit', '100');
    if (search) params.set('search', search);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    fetch(`/api/transactions?${params.toString()}`)
      .then((r) => r.json())
      .then(setTransactions);
  }, [search, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (editing?.id === id) setEditing(null);
    load();
  }

  const inputClass = 'bg-[#f5f2ed] border-0 rounded-[10px] px-3 py-1.5 text-xs text-[#3d342b] placeholder-[#6b5d52] focus:outline-none focus:ring-2 focus:ring-amber-500/30';

  return (
    <PageTransition>
      <h2 className="text-lg font-bold text-[#3d342b] mb-6">记账</h2>

      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <input
          type="text"
          placeholder="搜索备注..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass}
        />
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className={inputClass}
        />
        <span className="text-xs text-[#6b5d52]">至</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className={inputClass}
        />
        {(search || startDate || endDate) && (
          <button
            onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); }}
            className="text-xs text-[#6b5d52] hover:text-[#3d342b]"
          >
            清除筛选
          </button>
        )}
        <span className="text-xs text-[#6b5d52] ml-auto">{transactions.length} 条</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
        <TransactionForm
          onCreated={() => { load(); setEditing(null); }}
          edit={editing ? {
            id: editing.id,
            type: editing.type as 'expense' | 'income',
            amount: editing.amount,
            categoryId: editing.categoryId,
            channelId: editing.channelId,
            date: editing.date,
            note: editing.note || '',
          } : null}
          onCancelEdit={() => setEditing(null)}
        />
        <TransactionList
          transactions={transactions}
          onEdit={(t) => setEditing(t)}
          onDelete={handleDelete}
        />
      </div>
    </PageTransition>
  );
}
