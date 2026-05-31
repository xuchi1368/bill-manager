'use client';

import { useState } from 'react';
import { useCategoryIcon } from '@/lib/icon-map';

interface Transaction {
  id: string; type: string; amount: number; date: string;
  note?: string | null;
  categoryId: string; channelId: string;
  category: { name: string; icon: string };
  channel: { name: string };
  splits?: { id: string; categoryId: string; amount: number; category: { name: string; icon: string } }[];
}

export default function TransactionList({
  transactions, onEdit, onDelete, compact,
}: {
  transactions: Transaction[];
  onEdit?: (t: Transaction) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedSplits, setExpandedSplits] = useState<Set<string>>(new Set());
  const catIcon = useCategoryIcon();

  async function handleDelete(id: string) {
    if (!onDelete) return;
    if (!confirm('确定删除这条记录？')) return;
    setDeleting(id);
    await onDelete(id);
    setDeleting(null);
  }

  const cell = compact ? 'py-1.5 px-1.5' : 'py-3 px-3.5';
  const bodyClass = compact ? 'text-[13px]' : 'text-[13px]';
  const capClass = compact ? 'text-[11px]' : 'text-[11px]';

  return (
    <div className={compact ? '' : 'card overflow-hidden'}>
      <table className="w-full">
        {!compact && (
          <thead>
            <tr className="border-b border-[#ede6dd] caption">
              <th className="text-left py-2.5 px-3.5 font-medium">日期</th>
              <th className="text-left py-2.5 px-3.5 font-medium">类型</th>
              <th className="text-left py-2.5 px-3.5 font-medium">分类</th>
              <th className="text-left py-2.5 px-3.5 font-medium">渠道</th>
              <th className="text-left py-2.5 px-3.5 font-medium">备注</th>
              <th className="text-right py-2.5 px-3.5 font-medium">金额</th>
              {(onEdit || onDelete) && <th className="text-right py-2.5 px-3.5 font-medium w-16">操作</th>}
            </tr>
          </thead>
        )}
        <tbody>
          {transactions.map((t, i) => (
            <tr key={t.id}
              className="border-b border-[#f5f2ed] hover:bg-[#faf7f2] transition-all animate-slide-up"
              style={{ animationDelay: `${i * 0.04}s` }}
            >
              <td className={`${cell} text-[#6b5d52] font-medium`}>{t.date.slice(compact ? 5 : 0)}</td>
              <td className={`${cell} font-semibold ${t.type === 'income' ? 'text-[#2ea87a]' : 'text-[#e25c3b]'}`}>
                {t.type === 'income' ? '收入' : '支出'}
              </td>
              <td className={cell}>
                {t.splits && t.splits.length > 0 ? (
                  <div>
                    <button onClick={() => {
                      const next = new Set(expandedSplits);
                      next.has(t.id) ? next.delete(t.id) : next.add(t.id);
                      setExpandedSplits(next);
                    }} className="text-left">
                      {t.splits[0].category.icon} <span className="text-[#3d342b]">{t.splits[0].category.name}</span>
                      <span className="ml-1 text-amber-600 bg-amber-50 rounded-full px-1 py-0.5 text-[10px]">+{t.splits.length - 1}</span>
                    </button>
                    {expandedSplits.has(t.id) && (
                      <div className="mt-0.5 space-y-0.5 animate-slide-up">
                        {t.splits.slice(1).map(sp => (
                          <div key={sp.id} className={`text-[#6b5d52] pl-1 ${capClass}`}>
                            {sp.category.icon} {sp.category.name}: <span className="text-[#3d342b]">¥{sp.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>{catIcon(t.category.icon, t.category.name)} <span className="text-[#3d342b]">{t.category.name}</span></>
                )}
              </td>
              <td className={`${cell} text-[#3d342b]`}>{t.channel.name}</td>
              <td className={`${cell} text-[#6b5d52] max-w-[80px] truncate`}>{t.note || '—'}</td>
              <td className={`${cell} text-right amount font-semibold ${t.type === 'income' ? 'text-[#2ea87a]' : 'text-[#e25c3b]'}`}>
                {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
              </td>
              {(onEdit || onDelete) && (
                <td className={`${cell} text-right`}>
                  <div className="flex items-center justify-end gap-0.5">
                    {onEdit && <button onClick={() => onEdit(t)} className="px-1.5 py-0.5 rounded text-[#6b5d52] hover:text-[#3d342b] hover:bg-[#f5f2ed] transition-colors text-xs">编辑</button>}
                    {onDelete && <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id} className="px-1.5 py-0.5 rounded text-[#6b5d52] hover:text-[#e25c3b] hover:bg-rose-50 transition-colors disabled:opacity-30 text-xs">删除</button>}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
