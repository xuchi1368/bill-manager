'use client';

import { useEffect, useState, useCallback } from 'react';
import RecurringRuleForm from '@/components/RecurringRuleForm';

interface Rule {
  id: string;
  name: string;
  amount: number;
  type: string;
  frequency: string;
  nextDueDate: string;
  isActive: boolean;
  category: { name: string; icon: string };
  channel: { name: string };
}

const freqLabels: Record<string, string> = { daily: '每天', weekly: '每周', monthly: '每月', yearly: '每年' };

export default function RecurringPage() {
  const [rules, setRules] = useState<Rule[]>([]);

  const load = useCallback(() => {
    fetch('/api/recurring-rules').then((r) => r.json()).then(setRules);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(rule: Rule) {
    await fetch(`/api/recurring-rules/${rule.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/recurring-rules/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-6">📅 周期账单</h2>
      <RecurringRuleForm onCreated={load} />
      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{rule.category.icon}</span>
              <div>
                <div className="font-medium text-sm">{rule.name}</div>
                <div className="text-xs text-zinc-500">{freqLabels[rule.frequency]} | {rule.channel.name} | 下次: {rule.nextDueDate}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className={`font-bold text-sm ${rule.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                {rule.type === 'income' ? '+' : '-'}{rule.amount.toLocaleString()}
              </span>
              <button onClick={() => toggleActive(rule)} className={`text-xs px-2 py-1 rounded ${rule.isActive ? 'bg-green-900 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                {rule.isActive ? '启用' : '暂停'}
              </button>
              <button onClick={() => remove(rule.id)} className="text-zinc-600 hover:text-red-400 text-sm">🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
