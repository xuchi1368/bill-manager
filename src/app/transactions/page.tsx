'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PageTransition from '@/components/PageTransition';
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import DatePicker from '@/components/DatePicker';
import { LoadingSkeleton, ErrorState, EmptyState } from '@/components/PageState';
import { PenLine } from 'lucide-react';

interface Transaction {
  id: string; type: string; amount: number; date: string;
  note?: string | null;
  categoryId: string;
  channelId: string;
  category: { name: string; icon: string };
  channel: { name: string };
  splits?: { id: string; categoryId: string; amount: number; category: { name: string; icon: string } }[];
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    params.set('limit', '100');
    if (search) params.set('search', search);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    fetch(`/api/transactions?${params.toString()}`)
      .then((r) => { if (!r.ok) throw new Error('请求失败'); return r.json(); })
      .then((data) => { setTransactions(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [search, startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string) {
    if (!confirm('确定删除这笔交易吗？')) return;
    await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (editing?.id === id) setEditing(null);
    load();
  }

  const inputClass = 'bg-[#f5f2ed] border-0 rounded-[10px] px-3 py-1.5 text-xs text-[#3d342b] placeholder-[#6b5d52] focus:outline-none focus:ring-2 focus:ring-amber-500/30';

  return (
    <PageTransition>
      <h2 className="text-lg font-bold text-[#3d342b] mb-4">记账</h2>

      {error && <ErrorState message={error} onRetry={load} />}
      {loading && !error && <LoadingSkeleton rows={4} />}

      {!loading && !error && (<>
      <div className="flex gap-3 mb-4 flex-wrap items-center shrink-0">
        <input
          type="text"
          placeholder="搜索备注..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputClass}
        />
        <DatePicker value={startDate} onChange={setStartDate} placeholder="开始日期" />
        <span className="text-xs text-[#6b5d52]">至</span>
        <DatePicker value={endDate} onChange={setEndDate} placeholder="结束日期" />
        {(search || startDate || endDate) && (
          <button
            onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); }}
            className="text-xs text-[#6b5d52] hover:text-[#3d342b]"
          >
            清除筛选
          </button>
        )}
        <button
          onClick={() => {
            const p = new URLSearchParams();
            if (startDate) p.set('date_from', startDate);
            if (endDate) p.set('date_to', endDate);
            window.open(`/api/export/transactions?${p.toString()}`, '_blank');
          }}
          className="text-xs px-3 py-1.5 bg-[#2ea87a] hover:bg-emerald-500/90 text-white rounded-[8px] font-medium transition-colors cursor-pointer ml-auto"
        >
          📥 导出 CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 flex-1 min-h-0">
        <div className="flex flex-col min-h-0 flex-1">
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
        </div>
        <div className="overflow-y-auto min-h-0 flex flex-col">
          <div className="card overflow-hidden flex flex-col flex-1">
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#ede6dd] shrink-0">
              <h3 className="text-sm font-semibold text-[#3d342b]">交易记录</h3>
              <span className="text-xs text-[#6b5d52]">{transactions.length} 条</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <TransactionList
                transactions={transactions}
                onEdit={(t) => setEditing(t)}
                onDelete={handleDelete}
                compact
              />
            </div>
          </div>
        </div>
      </div>
      {transactions.length === 0 && (
        <EmptyState icon={<PenLine size={40} strokeWidth={1.5} />} title="暂无交易记录" desc="点击左侧表单添加第一笔收支" />
      )}
      </>)}
    </PageTransition>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<PageTransition><LoadingSkeleton rows={4} /></PageTransition>}>
      <TransactionsContent />
    </Suspense>
  );
}
