'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const EMOJI_OPTIONS = ['🍜','🍔','🍕','🥤','☕','🚗','🚌','⛽','🛒','👗','💄','🎮','🎬','🎵','📱','💻','🏠','💡','💧','📚','💊','🐱','🎁','✈️','🏥','🎓','💰','📈','💼','🏦','🧾','💳','🧹','🎂','⚽','🏋️','🧘','💇','🔧','📦','❤️','🌟','🔥'];

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

interface Rule {
  id: string;
  keyword: string;
  categoryId: string;
  isActive: boolean;
  priority: number;
  category: { name: string; icon: string };
}

const inputClass = 'bg-[#f5f2ed] border-0 rounded-[10px] px-3.5 py-2 text-sm text-[#3d342b] placeholder-[#6b5d52] focus:outline-none focus:ring-2 focus:ring-amber-500/30';

import PageTransition from '@/components/PageTransition';

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'categories' | 'channels' | 'import' | 'rules') || 'categories';
  const [tab, setTab] = useState<'categories' | 'channels' | 'import' | 'rules'>(initialTab);
  const [categories, setCategories] = useState<Category[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('📦');
  const [catType, setCatType] = useState<'expense' | 'income'>('expense');
  const [catBudget, setCatBudget] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [chName, setChName] = useState('');
  const [chType, setChType] = useState<'payment' | 'income'>('payment');
  const [chBalance, setChBalance] = useState('');
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferMsg, setTransferMsg] = useState('');
  const [transfers, setTransfers] = useState<any[]>([]);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPlatform, setImportPlatform] = useState<'wechat' | 'alipay'>('wechat');
  const [importParsing, setImportParsing] = useState(false);
  const [importResult, setImportResult] = useState<{ format: string; transactions: any[] } | null>(null);
  const [importError, setImportError] = useState('');
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importDone, setImportDone] = useState<{ imported: number; skipped: number } | null>(null);
  const [aiStatus, setAiStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [aiError, setAiError] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<{ index: number; categoryId: string; categoryName: string; categoryIcon: string; confidence: number; accepted: boolean }[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [ruleKeyword, setRuleKeyword] = useState('');
  const [ruleCategoryId, setRuleCategoryId] = useState('');
  const [rulePriority, setRulePriority] = useState('0');

  const loadCategories = useCallback(() => {
    fetch('/api/categories').then((r) => r.json()).then(setCategories);
  }, []);

  const loadChannels = useCallback(() => {
    fetch('/api/channels').then((r) => r.json()).then(setChannels);
  }, []);

  const loadRules = useCallback(() => {
    fetch('/api/categorization-rules').then((r) => r.json()).then(setRules);
  }, []);

  useEffect(() => { loadCategories(); loadChannels(); loadRules(); }, [loadCategories, loadChannels, loadRules]);

  async function addRule() {
    if (!ruleKeyword || !ruleCategoryId) return;
    await fetch('/api/categorization-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: ruleKeyword, categoryId: ruleCategoryId, priority: parseInt(rulePriority) || 0 }),
    });
    setRuleKeyword(''); setRulePriority('0');
    loadRules();
  }

  async function toggleRule(rule: Rule) {
    await fetch(`/api/categorization-rules/${rule.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    loadRules();
  }

  async function deleteRule(id: string) {
    await fetch(`/api/categorization-rules/${id}`, { method: 'DELETE' });
    loadRules();
  }

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

  async function handleImportUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setImportResult(null);
    setImportError('');
    setImportDone(null);
    setImportParsing(true);

    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/import/parse', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { setImportError(data.error || '解析失败'); setImportParsing(false); return; }
      setImportResult({ format: data.format, transactions: data.transactions.map((t: any) => ({
        ...t,
        _editCategoryId: t.categoryId,
        _editChannelId: t.channelId,
      })) });
    } catch {
      setImportError('解析请求失败');
    }
    setImportParsing(false);
  }

  function updateImportRow(i: number, field: string, value: string) {
    if (!importResult) return;
    const txns = [...importResult.transactions];
    txns[i] = { ...txns[i], [field]: value };
    setImportResult({ ...importResult, transactions: txns });
  }

  async function confirmImport() {
    if (!importResult) return;
    setImportSubmitting(true);
    const txns = importResult.transactions.map((t: any) => ({
      date: t.date,
      type: t.type,
      amount: t.amount,
      counterparty: t.counterparty,
      description: t.description,
      method: t.method,
      categoryId: t._editCategoryId,
      channelId: t._editChannelId,
    }));
    const res = await fetch('/api/import/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions: txns }),
    });
    const data = await res.json();
    if (res.ok) {
      setImportDone(data);
      setImportFile(null);
      setImportResult(null);
    } else {
      setImportError(data.error || '导入失败');
    }
    setImportSubmitting(false);
  }

  function cancelImport() {
    setImportFile(null);
    setImportResult(null);
    setImportError('');
    setImportDone(null);
    setAiStatus('idle');
    setAiError('');
    setAiSuggestions([]);
  }

  async function runAISuggest() {
    if (!importResult) return;
    setAiStatus('loading');
    setAiError('');
    const txns = importResult.transactions.map((t: any, i: number) => ({
      index: i,
      description: [t.counterparty, t.description].filter(Boolean).join(' - ') || `¥${t.amount}`,
      amount: t.amount,
      type: t.type,
    }));
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: txns, categories: allCategories }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error || 'AI 分析失败'); setAiStatus('error'); return; }
      setAiSuggestions(data.suggestions.map((s: any) => ({ ...s, accepted: true })));
      setAiStatus('done');
    } catch {
      setAiError('AI 请求失败');
      setAiStatus('error');
    }
  }

  function applyAISuggestions() {
    if (!importResult) return;
    const txns = [...importResult.transactions];
    for (const s of aiSuggestions) {
      if (s.accepted && txns[s.index]) {
        txns[s.index] = { ...txns[s.index], _editCategoryId: s.categoryId };
      }
    }
    setImportResult({ ...importResult, transactions: txns });
    setAiStatus('idle');
    setAiSuggestions([]);
  }

  async function loadTransfers() {
    const res = await fetch('/api/transfers');
    setTransfers(await res.json());
  }

  useEffect(() => {
    if (tab === 'channels') loadTransfers();
  }, [tab]);

  async function doTransfer() {
    if (!transferFrom || !transferTo || !transferAmount) return;
    const res = await fetch('/api/transfers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromId: transferFrom, toId: transferTo, amount: transferAmount, note: transferNote }),
    });
    const data = await res.json();
    if (res.ok) {
      setTransferAmount(''); setTransferNote(''); setTransferMsg(`转账成功: ¥${parseFloat(transferAmount).toFixed(2)}`);
      loadChannels();
      loadTransfers();
    } else {
      setTransferMsg(data.error || '转账失败');
    }
  }

  async function updateChannelBalance(id: string, val: string) {
    await fetch('/api/channels', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, balance: val }),
    });
    loadChannels();
  }

  const allCategories = categories;
  const allChannels = channels;
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  const tabBtn = (t: 'categories' | 'channels' | 'import' | 'rules', label: string) => (
    <button
      className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === t ? 'border-b-2 border-[#f59e0b] text-[#3d342b]' : 'text-[#6b5d52] hover:text-[#3d342b]'}`}
      onClick={() => setTab(t)}
    >
      {label}
    </button>
  );

  return (
    <PageTransition>
      <h2 className="text-lg font-bold text-[#3d342b] mb-6">设置</h2>

      <div className="flex gap-0 mb-6 border-b border-[#ede6dd]">
        {tabBtn('categories', '📂 收支分类')}
        {tabBtn('channels', '💳 渠道管理')}
        {tabBtn('import', '📥 数据导入')}
        {tabBtn('rules', '📏 自动分类')}
      </div>

      {tab === 'categories' && (
        <div>
          <div className="card p-4 mb-4 flex gap-3 flex-wrap items-end">
            <div>
              <label className="text-xs text-[#6b5d52] block mb-1">名称</label>
              <input value={catName} onChange={(e) => setCatName(e.target.value)} className={`${inputClass} w-32`} />
            </div>
            <div className="relative">
              <label className="text-xs text-[#6b5d52] block mb-1">图标</label>
              <button
                type="button"
                onClick={() => setShowEmoji(!showEmoji)}
                className={`${inputClass} w-16 text-lg text-center cursor-pointer`}
              >{catIcon}</button>
              {showEmoji && (
                <div className="absolute top-full mt-1 z-50 card p-2 grid grid-cols-9 gap-1 w-72 shadow-lg">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => { setCatIcon(e); setShowEmoji(false); }}
                      className={`w-7 h-7 text-sm rounded hover:bg-[#f5f2ed] ${catIcon === e ? 'bg-amber-50 ring-1 ring-[#f59e0b]' : ''}`}
                    >{e}</button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-[#6b5d52] block mb-1">类型</label>
              <select value={catType} onChange={(e) => setCatType(e.target.value as 'expense' | 'income')} className={inputClass}>
                <option value="expense">支出</option>
                <option value="income">收入</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#6b5d52] block mb-1">月度预算</label>
              <input type="number" value={catBudget} onChange={(e) => setCatBudget(e.target.value)} placeholder="可选" className={`${inputClass} w-28`} />
            </div>
            <button onClick={addCategory} className="px-4 py-2 bg-[#f59e0b] hover:bg-amber-500/90 active:scale-95 text-white font-medium rounded-[10px] text-sm transition-all">添加</button>
          </div>

          <h3 className="text-sm font-semibold text-[#3d342b] mb-2">支出分类</h3>
          <div className="space-y-1 mb-4">
            {expenseCategories.map((c) => (
              <div key={c.id} className="card p-3 flex items-center justify-between">
                <span className="text-[#3d342b]">{c.icon} {c.name}</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#6b5d52]">预算:</span>
                    <input
                      type="number"
                      value={c.budgetLimit ?? ''}
                      onChange={(e) => updateCategoryBudget(c.id, e.target.value ? parseFloat(e.target.value) : null)}
                      className="bg-[#f5f2ed] border-0 rounded-md px-2 py-1 text-[#3d342b] w-24 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                      placeholder="不限"
                    />
                  </div>
                  <button onClick={() => deleteCategory(c.id)} className="text-[#6b5d52] hover:text-[#e25c3b] text-xs">删除</button>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-[#3d342b] mb-2">收入分类</h3>
          <div className="space-y-1">
            {incomeCategories.map((c) => (
              <div key={c.id} className="card p-3 flex items-center justify-between">
                <span className="text-[#3d342b]">{c.icon} {c.name}</span>
                <button onClick={() => deleteCategory(c.id)} className="text-[#6b5d52] hover:text-[#e25c3b] text-xs">删除</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'channels' && (
        <div>
          <div className="card p-4 mb-4 flex gap-3 flex-wrap items-end">
            <div>
              <label className="text-xs text-[#6b5d52] block mb-1">名称</label>
              <input value={chName} onChange={(e) => setChName(e.target.value)} className={`${inputClass} w-32`} />
            </div>
            <div>
              <label className="text-xs text-[#6b5d52] block mb-1">类型</label>
              <select value={chType} onChange={(e) => setChType(e.target.value as 'payment' | 'income')} className={inputClass}>
                <option value="payment">支付渠道</option>
                <option value="income">收入渠道</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#6b5d52] block mb-1">初始余额</label>
              <input type="number" step="0.01" value={chBalance} onChange={(e) => setChBalance(e.target.value)} placeholder="0" className={`${inputClass} w-24`} />
            </div>
            <button onClick={async () => {
              if (!chName) return;
              await fetch('/api/channels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: chName, type: chType, balance: chBalance || '0' }),
              });
              setChName(''); setChBalance('');
              loadChannels();
            }} className="px-4 py-2 bg-[#f59e0b] hover:bg-amber-500/90 active:scale-95 text-white font-medium rounded-[10px] text-sm transition-all">添加</button>
          </div>

          <div className="space-y-1 mb-6">
            {channels.map((c: any) => (
              <div key={c.id} className="card p-3 flex items-center justify-between">
                <span className="text-[#3d342b]">{c.name} <span className="text-xs text-[#6b5d52]">({c.type === 'payment' ? '支付' : '收入'})</span></span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#6b5d52]">余额:</span>
                    <input
                      type="number"
                      step="0.01"
                      value={c.balance ?? ''}
                      onChange={(e) => updateChannelBalance(c.id, e.target.value)}
                      className={`bg-[#f5f2ed] border-0 rounded-md px-2 py-1 w-28 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 ${(c.balance || 0) >= 0 ? 'text-[#2ea87a]' : 'text-[#e25c3b]'}`}
                    />
                  </div>
                  <button onClick={() => deleteChannel(c.id)} className="text-[#6b5d52] hover:text-[#e25c3b] text-xs">删除</button>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-semibold text-[#3d342b] mb-3">💸 账户转账</h3>
          <div className="card p-4 mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <select value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)} className={inputClass}>
                <option value="">转出账户</option>
                {channels.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name} (¥{(c.balance || 0).toLocaleString()})</option>
                ))}
              </select>
              <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className={inputClass}>
                <option value="">转入账户</option>
                {channels.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="金额"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="备注（选填）"
                value={transferNote}
                onChange={(e) => setTransferNote(e.target.value)}
                className={inputClass}
              />
            </div>
            {transferMsg && <p className={`text-xs mb-2 ${transferMsg.includes('成功') ? 'text-[#2ea87a]' : 'text-[#e25c3b]'}`}>{transferMsg}</p>}
            <button onClick={doTransfer} className="px-4 py-2 bg-[#2ea87a] hover:bg-emerald-500/90 text-white font-medium rounded-[10px] text-sm transition-colors">确认转账</button>
          </div>

          {transfers.length > 0 && (
            <div className="card p-4">
              <h3 className="text-sm font-semibold text-[#3d342b] mb-2">📋 最近转账记录</h3>
              <div className="space-y-1">
                {transfers.slice(0, 10).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between text-xs text-[#3d342b] py-1 border-b border-[#f5f2ed] last:border-0">
                    <span>{t.from.name} → {t.to.name} {t.note && `(${t.note})`}</span>
                    <span className="text-[#2ea87a] font-medium">¥{t.amount.toFixed(2)}</span>
                    <span className="text-[#6b5d52]">{new Date(t.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'import' && (
        <div>
          {importDone && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 text-[#2ea87a] text-sm">
              ✅ 导入完成：成功 {importDone.imported} 条，跳过 {importDone.skipped} 条
              <button onClick={() => setImportDone(null)} className="ml-3 text-[#2ea87a] underline">关闭</button>
            </div>
          )}

          {importError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-4 text-[#e25c3b] text-sm">
              {importError}
              <button onClick={() => setImportError('')} className="ml-3 text-[#e25c3b] underline">关闭</button>
            </div>
          )}

          {!importResult && (
            <>
              <div className="card p-4 mb-4">
                <h3 className="text-sm font-semibold text-[#3d342b] mb-3">选择平台并上传账单文件</h3>
                <div className="flex gap-3 mb-3">
                  <button
                    type="button"
                    className={`px-4 py-1.5 rounded-[10px] text-sm font-medium transition-colors ${importPlatform === 'wechat' ? 'bg-[#2ea87a] text-white' : 'bg-[#f5f2ed] text-[#6b5d52]'}`}
                    onClick={() => setImportPlatform('wechat')}
                  >
                    微信
                  </button>
                  <button
                    type="button"
                    className={`px-4 py-1.5 rounded-[10px] text-sm font-medium transition-colors ${importPlatform === 'alipay' ? 'bg-[#f59e0b] text-white' : 'bg-[#f5f2ed] text-[#6b5d52]'}`}
                    onClick={() => setImportPlatform('alipay')}
                  >
                    支付宝
                  </button>
                </div>
                <p className="text-xs text-[#6b5d52] mb-3">
                  {importPlatform === 'wechat'
                    ? '微信：我 → 服务 → 钱包 → 账单 → 常见问题 → 下载账单 → 用于个人对账'
                    : '支付宝：我的 → 账单 → 右上角筛选 → 开具交易流水证明 → 用于对账'}
                </p>
                <label className="block bg-[#faf7f2] border border-dashed border-[#d6cec4] rounded-xl p-6 text-center cursor-pointer hover:border-[#f59e0b] transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportUpload}
                    className="hidden"
                  />
                  <span className="text-[#6b5d52] text-sm">
                    {importParsing ? '解析中...' : `📂 选择${importPlatform === 'wechat' ? '微信' : '支付宝'}账单 CSV 文件`}
                  </span>
                </label>
              </div>
            </>
          )}

          {importResult && (
            <div className="card p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-semibold text-[#3d342b]">
                  预览：{importResult.transactions.length} 条交易（{importResult.format === 'wechat' ? '微信' : '支付宝'}）
                </h3>
                <button onClick={cancelImport} className="text-xs text-[#6b5d52] hover:text-[#3d342b]">取消</button>
              </div>

              <div className="overflow-x-auto max-h-96 overflow-y-auto mb-4 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="text-[#6b5d52] border-b border-[#ede6dd] sticky top-0 bg-white">
                    <tr>
                      <th className="text-left py-2 pr-2 whitespace-nowrap font-medium">日期</th>
                      <th className="text-left py-2 pr-2 whitespace-nowrap font-medium">类型</th>
                      <th className="text-right py-2 pr-2 whitespace-nowrap font-medium">金额</th>
                      <th className="text-left py-2 pr-2 whitespace-nowrap font-medium">对方</th>
                      <th className="text-left py-2 pr-2 whitespace-nowrap font-medium">说明</th>
                      <th className="text-left py-2 pr-2 whitespace-nowrap font-medium">分类</th>
                      <th className="text-left py-2 pr-2 whitespace-nowrap font-medium">渠道</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResult.transactions.map((t: any, i: number) => (
                      <tr key={i} className="border-b border-[#f5f2ed]">
                        <td className="py-1.5 pr-2 text-[#3d342b] whitespace-nowrap">{t.date}</td>
                        <td className={`py-1.5 pr-2 whitespace-nowrap font-medium ${t.type === 'income' ? 'text-[#2ea87a]' : 'text-[#e25c3b]'}`}>
                          {t.type === 'income' ? '收入' : '支出'}
                        </td>
                        <td className="py-1.5 pr-2 text-right text-[#3d342b] whitespace-nowrap">{t.amount.toFixed(2)}</td>
                        <td className="py-1.5 pr-2 text-[#3d342b] max-w-[80px] truncate">{t.counterparty}</td>
                        <td className="py-1.5 pr-2 text-[#6b5d52] max-w-[100px] truncate">{t.description || '-'}</td>
                        <td className="py-1.5 pr-2">
                          <select
                            value={t._editCategoryId}
                            onChange={(e) => updateImportRow(i, '_editCategoryId', e.target.value)}
                            className="bg-[#f5f2ed] border-0 rounded-md px-1 py-0.5 text-[#3d342b] w-20 text-xs focus:outline-none"
                          >
                            <option value="">-</option>
                            {allCategories.filter((c: any) => c.type === t.type).map((c: any) => (
                              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-1.5 pr-2">
                          <select
                            value={t._editChannelId}
                            onChange={(e) => updateImportRow(i, '_editChannelId', e.target.value)}
                            className="bg-[#f5f2ed] border-0 rounded-md px-1 py-0.5 text-[#3d342b] w-20 text-xs focus:outline-none"
                          >
                            <option value="">-</option>
                            {allChannels.map((c: any) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {aiStatus === 'idle' && (
                <button
                  onClick={runAISuggest}
                  className="px-4 py-2 bg-purple-50 text-purple-600 border border-purple-200 rounded-[10px] text-sm hover:bg-purple-100 transition-colors mb-4"
                >
                  🤖 AI 智能分类
                </button>
              )}

              {aiStatus === 'loading' && (
                <div className="mb-4 bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-600">
                  <span className="animate-pulse">🤖 AI 正在分析 {importResult.transactions.length} 条交易...</span>
                </div>
              )}

              {aiStatus === 'error' && (
                <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl p-4 text-sm text-[#e25c3b]">
                  {aiError}
                  <button onClick={() => { setAiStatus('idle'); setAiError(''); }} className="ml-3 underline">关闭</button>
                </div>
              )}

              {aiStatus === 'done' && (
                <div className="mb-4 bg-purple-50/50 border border-purple-100 rounded-xl p-4 animate-slide-up">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-[#3d342b]">🤖 AI 分类建议 ({aiSuggestions.length} 条)</h4>
                    <div className="flex gap-2">
                      <button onClick={() => setAiSuggestions(aiSuggestions.map(s => ({ ...s, accepted: true })))} className="text-xs text-[#6b5d52] hover:text-[#3d342b]">全部接受</button>
                      <button onClick={() => setAiSuggestions(aiSuggestions.map(s => ({ ...s, accepted: false })))} className="text-xs text-[#6b5d52] hover:text-[#3d342b]">全部拒绝</button>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto mb-3">
                    {aiSuggestions.map((s) => {
                      const t = importResult.transactions[s.index];
                      const confidenceColor = s.confidence >= 80 ? 'text-[#2ea87a]' : s.confidence >= 50 ? 'text-amber-600' : 'text-[#e25c3b]';
                      return (
                        <button
                          key={s.index}
                          onClick={() => {
                            const next = [...aiSuggestions];
                            next[s.index] = { ...s, accepted: !s.accepted };
                            setAiSuggestions(next);
                          }}
                          className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition-all ${
                            s.accepted ? 'bg-white border border-purple-100' : 'bg-[#faf7f2] opacity-50'
                          }`}
                        >
                          <span>{s.categoryIcon}</span>
                          <span className="flex-1 text-[#3d342b]">{t?.counterparty || t?.description || `¥${t?.amount}`}</span>
                          <span className="text-[#6b5d52]">→</span>
                          <span className="text-[#3d342b] font-medium">{s.categoryIcon} {s.categoryName}</span>
                          <span className={`font-mono ${confidenceColor}`}>{s.confidence}%</span>
                          <span className={`text-xs ${s.accepted ? 'text-[#2ea87a]' : 'text-[#6b5d52]'}`}>
                            {s.accepted ? '✓' : '✗'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={applyAISuggestions}
                    className="px-4 py-1.5 bg-purple-100 text-purple-700 rounded-[10px] text-sm font-medium hover:bg-purple-200 transition-colors"
                    disabled={aiSuggestions.filter(s => s.accepted).length === 0}
                  >
                    应用 {aiSuggestions.filter(s => s.accepted).length} 条已接受的建议
                  </button>
                </div>
              )}

              <button
                onClick={confirmImport}
                disabled={importSubmitting}
                className="px-6 py-2 bg-[#2ea87a] hover:bg-emerald-500/90 text-white font-medium rounded-[10px] text-sm transition-colors disabled:opacity-50"
              >
                {importSubmitting ? '导入中...' : `确认导入 ${importResult.transactions.length} 条`}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'rules' && (
        <div>
          <div className="card p-4 mb-4 flex gap-3 flex-wrap items-end">
            <div>
              <label className="text-xs text-[#6b5d52] block mb-1">关键词</label>
              <input value={ruleKeyword} onChange={(e) => setRuleKeyword(e.target.value)} placeholder="例如：美团" className={`${inputClass} w-32`} />
            </div>
            <div>
              <label className="text-xs text-[#6b5d52] block mb-1">目标分类</label>
              <select value={ruleCategoryId} onChange={(e) => setRuleCategoryId(e.target.value)} className={inputClass}>
                <option value="">选择分类</option>
                {allCategories.map((c) => (<option key={c.id} value={c.id}>{c.icon} {c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#6b5d52] block mb-1">优先级</label>
              <input type="number" value={rulePriority} onChange={(e) => setRulePriority(e.target.value)} className={`${inputClass} w-16`} />
            </div>
            <button onClick={addRule} className="px-4 py-2 bg-[#f59e0b] hover:bg-amber-500/90 active:scale-95 text-white font-medium rounded-[10px] text-sm transition-all">添加</button>
          </div>

          <div className="space-y-1">
            {rules.map((rule) => (
              <div key={rule.id} className="card p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-[#3d342b]">&ldquo;{rule.keyword}&rdquo;</span>
                  <span className="text-xs text-[#6b5d52]">→</span>
                  <span className="text-[#3d342b] text-sm">{rule.category.icon} {rule.category.name}</span>
                  <span className="text-xs text-[#6b5d52]">优先级 {rule.priority}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleRule(rule)} className={`text-xs px-2 py-1 rounded-[6px] transition-colors ${rule.isActive ? 'bg-emerald-50 text-[#2ea87a]' : 'bg-[#f5f2ed] text-[#6b5d52]'}`}>
                    {rule.isActive ? '启用' : '暂停'}
                  </button>
                  <button onClick={() => deleteRule(rule.id)} className="text-[#6b5d52] hover:text-[#e25c3b] text-xs">删除</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageTransition>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[#6b5d52]">加载中...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
