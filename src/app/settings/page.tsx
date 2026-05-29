'use client';

import { useEffect, useState, useCallback } from 'react';

interface Category {
  id: string;
  name: string;
  icon: string;
  type: string;
  budgetLimit: number | null;
}

interface Channel {
  id: string;
  name: string;
  type: string;
}

export default function SettingsPage() {
  const [tab, setTab] = useState<'categories' | 'channels'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('📦');
  const [catType, setCatType] = useState<'expense' | 'income'>('expense');
  const [catBudget, setCatBudget] = useState('');
  const [chName, setChName] = useState('');
  const [chType, setChType] = useState<'payment' | 'income'>('payment');

  const loadCategories = useCallback(() => {
    fetch('/api/categories').then((r) => r.json()).then(setCategories);
  }, []);

  const loadChannels = useCallback(() => {
    fetch('/api/channels').then((r) => r.json()).then(setChannels);
  }, []);

  useEffect(() => { loadCategories(); loadChannels(); }, [loadCategories, loadChannels]);

  async function addCategory() {
    if (!catName) return;
    await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: catName, icon: catIcon, type: catType, budgetLimit: catBudget || null }),
    });
    setCatName(''); setCatBudget('');
    loadCategories();
  }

  async function updateCategoryBudget(id: string, budgetLimit: number | null) {
    await fetch('/api/categories', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, budgetLimit }),
    });
    loadCategories();
  }

  async function deleteCategory(id: string) {
    await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
    loadCategories();
  }

  async function addChannel() {
    if (!chName) return;
    await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: chName, type: chType }),
    });
    setChName('');
    loadChannels();
  }

  async function deleteChannel(id: string) {
    await fetch(`/api/channels?id=${id}`, { method: 'DELETE' });
    loadChannels();
  }

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-6">⚙️ 设置</h2>

      <div className="flex gap-0 mb-4 border-b border-zinc-800">
        <button
          className={`px-4 py-2 text-sm ${tab === 'categories' ? 'border-b-2 border-blue-500 text-white' : 'text-zinc-500'}`}
          onClick={() => setTab('categories')}
        >
          📂 收支分类
        </button>
        <button
          className={`px-4 py-2 text-sm ${tab === 'channels' ? 'border-b-2 border-blue-500 text-white' : 'text-zinc-500'}`}
          onClick={() => setTab('channels')}
        >
          💳 渠道管理
        </button>
      </div>

      {tab === 'categories' && (
        <div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-4 flex gap-3 flex-wrap items-end">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">名称</label>
              <input value={catName} onChange={(e) => setCatName(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white w-32" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">图标</label>
              <input value={catIcon} onChange={(e) => setCatIcon(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white w-20" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">类型</label>
              <select value={catType} onChange={(e) => setCatType(e.target.value as 'expense' | 'income')} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white">
                <option value="expense">支出</option>
                <option value="income">收入</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">月度预算</label>
              <input type="number" value={catBudget} onChange={(e) => setCatBudget(e.target.value)} placeholder="可选" className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white w-28" />
            </div>
            <button onClick={addCategory} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm">添加</button>
          </div>

          <h3 className="text-sm text-zinc-400 mb-2">支出分类</h3>
          <div className="space-y-1 mb-4">
            {expenseCategories.map((c) => (
              <div key={c.id} className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 flex items-center justify-between">
                <span>{c.icon} {c.name}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500">预算:</span>
                    <input
                      type="number"
                      value={c.budgetLimit ?? ''}
                      onChange={(e) => updateCategoryBudget(c.id, e.target.value ? parseFloat(e.target.value) : null)}
                      className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-white w-24 text-xs"
                      placeholder="不限"
                    />
                  </div>
                  <button onClick={() => deleteCategory(c.id)} className="text-zinc-600 hover:text-red-400 text-xs">删除</button>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-sm text-zinc-400 mb-2">收入分类</h3>
          <div className="space-y-1">
            {incomeCategories.map((c) => (
              <div key={c.id} className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 flex items-center justify-between">
                <span>{c.icon} {c.name}</span>
                <button onClick={() => deleteCategory(c.id)} className="text-zinc-600 hover:text-red-400 text-xs">删除</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'channels' && (
        <div>
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-4 flex gap-3 flex-wrap items-end">
            <div>
              <label className="text-xs text-zinc-500 block mb-1">名称</label>
              <input value={chName} onChange={(e) => setChName(e.target.value)} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white w-32" />
            </div>
            <div>
              <label className="text-xs text-zinc-500 block mb-1">类型</label>
              <select value={chType} onChange={(e) => setChType(e.target.value as 'payment' | 'income')} className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white">
                <option value="payment">支付渠道</option>
                <option value="income">收入渠道</option>
              </select>
            </div>
            <button onClick={addChannel} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm">添加</button>
          </div>
          <div className="space-y-1">
            {channels.map((c) => (
              <div key={c.id} className="bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 flex items-center justify-between">
                <span>{c.name} <span className="text-xs text-zinc-500">({c.type === 'payment' ? '支付' : '收入'})</span></span>
                <button onClick={() => deleteChannel(c.id)} className="text-zinc-600 hover:text-red-400 text-xs">删除</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
