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
  channelId: string | null;
  amountMin: number | null;
  amountMax: number | null;
  isActive: boolean;
  priority: number;
  category: { name: string; icon: string };
  channel?: { name: string } | null;
}

const inputClass = 'bg-[#f5f2ed] border-0 rounded-[10px] px-3.5 py-2 text-sm text-[#3d342b] placeholder-[#6b5d52] focus:outline-none focus:ring-2 focus:ring-amber-500/30';

import PageTransition from '@/components/PageTransition';
import { useIconTheme } from '@/components/IconProvider';
import { useAppTheme, THEMES, type ThemeName } from '@/components/ThemeProvider';
import AppIcon, { type IconName } from '@/components/AppIcon';
import { useCategoryIcon } from '@/lib/icon-map';
import { getTitlebarStyle, setTitlebarStyle, type TitlebarStyle } from '@/lib/titlebar-store';

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'categories' | 'channels' | 'import' | 'rules' | 'backup' | 'appearance') || 'categories';
  const [tab, setTab] = useState<'categories' | 'channels' | 'import' | 'rules' | 'backup' | 'appearance'>(initialTab);
  const { theme, setTheme } = useIconTheme();
  const { theme: appTheme, setTheme: setAppTheme } = useAppTheme();
  const renderIcon = useCategoryIcon();
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
  const [dragOver, setDragOver] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [ruleKeyword, setRuleKeyword] = useState('');
  const [ruleCategoryId, setRuleCategoryId] = useState('');
  const [ruleChannelId, setRuleChannelId] = useState('');
  const [ruleAmountMin, setRuleAmountMin] = useState('');
  const [ruleAmountMax, setRuleAmountMax] = useState('');
  const [rulePriority, setRulePriority] = useState('0');

  const [titlebarStyle, setTitlebarStyleState] = useState<TitlebarStyle>('auto');

  useEffect(() => {
    setTitlebarStyleState(getTitlebarStyle());
  }, []);

  function handleTitlebarChange(s: TitlebarStyle) {
    setTitlebarStyleState(s);
    setTitlebarStyle(s);
    // 触发 storage 事件让 TitleBar 组件感知变化
    window.dispatchEvent(new Event('storage'));
  }

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

  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId && tab === 'categories') {
      setTimeout(() => {
        const el = document.getElementById(`category-${highlightId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.style.boxShadow = '0 0 0 3px #f59e0b';
          el.style.borderRadius = '8px';
          el.style.transition = 'box-shadow 0.3s';
          setTimeout(() => { el.style.boxShadow = ''; }, 2000);
        }
      }, 300);
    }
  }, [searchParams, tab]);

  async function addRule() {
    if (!ruleKeyword || !ruleCategoryId) return;
    await fetch('/api/categorization-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword: ruleKeyword,
        categoryId: ruleCategoryId,
        channelId: ruleChannelId || null,
        amountMin: ruleAmountMin ? parseFloat(ruleAmountMin) : null,
        amountMax: ruleAmountMax ? parseFloat(ruleAmountMax) : null,
        priority: parseInt(rulePriority) || 0,
      }),
    });
    setRuleKeyword(''); setRuleChannelId(''); setRuleAmountMin(''); setRuleAmountMax(''); setRulePriority('0');
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
    if (!confirm('确定删除这条规则吗？')) return;
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
    if (!confirm('确定删除这个分类吗？相关交易不会被删除。')) return;
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
    if (!confirm('确定删除这个渠道吗？相关交易不会被删除。')) return;
    await fetch(`/api/channels?id=${id}`, { method: 'DELETE' });
    loadChannels();
  }

  async function processFile(file: File) {
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

  async function handleImportUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
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

  const tabBtn = (t: 'categories' | 'channels' | 'import' | 'rules' | 'backup' | 'appearance', icon: IconName, label: string) => (
    <button
      className={`px-4 py-2.5 text-sm font-medium transition-colors ${tab === t ? 'border-b-2 border-[#f59e0b] text-[#3d342b]' : 'text-[#6b5d52] hover:text-[#3d342b]'}`}
      onClick={() => setTab(t)}
    >
      <AppIcon name={icon} size={16} /> {label}
    </button>
  );

  return (
    <PageTransition>
      <h2 className="text-lg font-bold text-[#3d342b] mb-4">设置</h2>

      <div className="flex gap-0 mb-4 border-b border-[#ede6dd] overflow-x-auto">
        {tabBtn('categories', 'categories', '收支分类')}
        {tabBtn('channels', 'channels', '渠道管理')}
        {tabBtn('import', 'import', '数据导入')}
        {tabBtn('rules', 'rules', '自动分类')}
        {tabBtn('backup', 'backup', '数据备份')}
        {tabBtn('appearance', 'appearance', '外观')}
      </div>

      {tab === 'categories' && (
        <>
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
              <div key={c.id} id={`category-${c.id}`} className="card p-3 flex items-center justify-between">
                <span className="text-[#3d342b]">{renderIcon(c.icon, c.name)} {c.name}</span>
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
              <div key={c.id} id={`category-${c.id}`} className="card p-3 flex items-center justify-between">
                <span className="text-[#3d342b]">{renderIcon(c.icon, c.name)} {c.name}</span>
                <button onClick={() => deleteCategory(c.id)} className="text-[#6b5d52] hover:text-[#e25c3b] text-xs">删除</button>
              </div>
            ))}
          </div>
        </div>
      </>
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

          <div className="space-y-1 mb-4">
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
                <label
                  className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                    dragOver ? 'border-[#f59e0b] bg-amber-50' : 'border-[#d6cec4] bg-[#faf7f2] hover:border-[#f59e0b]'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) processFile(file);
                  }}
                >
                  <input
                    type="file"
                    accept={importPlatform === 'wechat' ? '.xlsx' : '.csv'}
                    onChange={handleImportUpload}
                    className="hidden"
                  />
                  <span className="text-[#6b5d52] text-sm">
                    {importParsing ? '解析中...' : dragOver ? '松开以导入文件' : `选择或拖入${importPlatform === 'wechat' ? '微信' : '支付宝'}账单${importPlatform === 'wechat' ? ' XLSX' : ' CSV'}文件`}
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

              {/* 快速统计 */}
              {(() => {
                const withCat = importResult.transactions.filter((t: any) => t.categoryId).length;
                const withoutCat = importResult.transactions.length - withCat;
                return (
                  <div className="mb-4 p-3 bg-[#faf7f2] rounded-xl border border-[#ede6dd] text-xs text-[#3d342b]">
                    共 {importResult.transactions.length} 条 ·
                    <span className="text-[#2ea87a] font-medium"> 已分类 {withCat} 条</span>
                    {withoutCat > 0 && <span className="text-[#e25c3b] font-medium"> · 未分类 {withoutCat} 条</span>}
                    {withoutCat > 0 && <span className="text-[#6b5d52]">（请在表格中手动选择分类后导入）</span>}
                  </div>
                );
              })()}

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
              <label className="text-xs text-[#6b5d52] block mb-1">渠道（可选）</label>
              <select value={ruleChannelId} onChange={(e) => setRuleChannelId(e.target.value)} className={`${inputClass} w-24`}>
                <option value="">不限</option>
                {allChannels.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#6b5d52] block mb-1">金额范围</label>
              <div className="flex items-center gap-1">
                <input type="number" step="0.01" value={ruleAmountMin} onChange={(e) => setRuleAmountMin(e.target.value)} placeholder="最小值" className={`${inputClass} w-20`} />
                <span className="text-xs text-[#6b5d52]">~</span>
                <input type="number" step="0.01" value={ruleAmountMax} onChange={(e) => setRuleAmountMax(e.target.value)} placeholder="最大值" className={`${inputClass} w-20`} />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#6b5d52] block mb-1">优先级</label>
              <input type="number" value={rulePriority} onChange={(e) => setRulePriority(e.target.value)} className={`${inputClass} w-16`} />
            </div>
            <button onClick={addRule} className="px-4 py-2 bg-[#f59e0b] hover:bg-amber-500/90 active:scale-95 text-white font-medium rounded-[10px] text-sm transition-all">添加</button>
          </div>

          <div className="space-y-1">
            {rules.map((rule) => (
              <div key={rule.id} className="card p-3 flex items-center justify-between flex-wrap gap-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm font-medium text-[#3d342b]">&ldquo;{rule.keyword}&rdquo;</span>
                  <span className="text-xs text-[#6b5d52]">→</span>
                  <span className="text-[#3d342b] text-sm">{rule.category.icon} {rule.category.name}</span>
                  {rule.channel && <span className="text-xs text-[#6b5d52]">渠道: {rule.channel.name}</span>}
                  {(rule.amountMin || rule.amountMax) && (
                    <span className="text-xs text-[#6b5d52]">
                      ¥{rule.amountMin ?? 0} ~ {rule.amountMax ? `¥${rule.amountMax}` : '不限'}
                    </span>
                  )}
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

      {tab === 'appearance' && (
        <div>
          {/* Theme selector */}
          <div className="card p-4 mb-4">
            <h3 className="text-sm font-semibold text-[#3d342b] mb-3">应用主题</h3>
            <div className="flex flex-wrap gap-2">
              {([
                ['warm', '暖纸'], ['dark', '暗夜'], ['mint', '薄荷'], ['bento', '极简'], ['bold', '粗犷'],
              ] as [ThemeName, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setAppTheme(key)}
                  className={`px-3 py-2 rounded-[10px] text-xs font-medium transition-all cursor-pointer border-2 ${
                    appTheme === key ? 'border-[#f59e0b] bg-amber-50' : 'border-transparent bg-[#f5f2ed] text-[#6b5d52] hover:bg-[#ede6dd]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full border" style={{ background: THEMES[key].bg, borderColor: THEMES[key].border }} />
                    <div className="w-4 h-4 rounded-full border" style={{ background: THEMES[key].card, borderColor: THEMES[key].border }} />
                    <div className="w-4 h-4 rounded-full" style={{ background: THEMES[key].accent }} />
                    <span>{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4 mb-4">
            <h3 className="text-sm font-semibold text-[#3d342b] mb-3">标题栏风格</h3>
            <p className="text-xs text-[#6b5d52] mb-3">
              仅 Electron 桌面版生效。切换后立即应用。
            </p>
            <div className="flex flex-wrap gap-2 mb-4">
              {(['auto', 'windows', 'mac'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => handleTitlebarChange(s)}
                  className={`px-4 py-2 rounded-[10px] text-sm font-medium transition-all cursor-pointer ${
                    titlebarStyle === s
                      ? 'bg-[#f59e0b] text-white shadow-sm'
                      : 'bg-[#f5f2ed] text-[#6b5d52] hover:bg-[#ede6dd]'
                  }`}
                >
                  {s === 'auto' ? '跟随系统' : s === 'windows' ? 'Windows 风格' : 'Mac 风格'}
                </button>
              ))}
            </div>
            {/* 实时预览 */}
            <div className="p-3 bg-[#faf7f2] rounded-xl border border-[#ede6dd]">
              <p className="text-xs text-[#6b5d52] mb-2">预览效果：</p>
              <div style={{
                height: 36, background: '#faf7f2',
                borderBottom: '2px solid #f59e0b',
                display: 'flex', alignItems: 'center',
                padding: '0 14px', borderRadius: '6px 6px 0 0',
              }}>
                {titlebarStyle === 'mac' ? (
                  <>
                    <div style={{ display: 'flex', gap: 5, marginRight: 12 }}>
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ee6b5b' }} />
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#f0c14b' }} />
                      <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#63c556' }} />
                    </div>
                    <span style={{ fontSize: 11, color: '#6b5d52' }}>账单管理</span>
                  </>
                ) : (
                  <>
                    <div style={{ width: 5, height: 5, background: '#f59e0b', borderRadius: '50%', marginRight: 6 }} />
                    <span style={{ fontSize: 11, color: '#3d342b', fontWeight: 600, flex: 1 }}>账单管理</span>
                    <div style={{ display: 'flex', gap: 1 }}>
                      <svg width="8" height="8"><line x1="1" y1="4" x2="7" y2="4" stroke="#6b5d52" strokeWidth="1"/></svg>
                      <svg width="8" height="8"><rect x="1" y="1" width="6" height="6" fill="none" stroke="#6b5d52" strokeWidth="1"/></svg>
                      <svg width="8" height="8"><line x1="1.5" y1="1.5" x2="6.5" y2="6.5" stroke="#c97d60" strokeWidth="1"/><line x1="6.5" y1="1.5" x2="1.5" y2="6.5" stroke="#c97d60" strokeWidth="1"/></svg>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-[#3d342b] mb-3">图标风格</h3>
            {(['lucide', 'emoji', 'colored'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-3 py-1.5 mr-2 text-xs rounded-[8px] font-medium transition-all cursor-pointer ${
                  theme === t
                    ? 'bg-[#f59e0b] text-white shadow-sm'
                    : 'bg-[#f5f2ed] text-[#6b5d52] hover:bg-[#ede6dd]'
                }`}
              >
                {t === 'lucide' ? 'Lucide 线性' : t === 'emoji' ? 'Emoji' : '色块图标'}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'backup' && (
        <div>
          <div className="card p-4 mb-4">
            <h3 className="text-sm font-semibold text-[#3d342b] mb-3">数据库备份与恢复</h3>
            <p className="text-xs text-[#6b5d52] mb-3">下载完整数据库文件 (.db)，可用于迁移数据或恢复。如需可读的账单文件，请在记账页使用导出 CSV 功能。</p>
            <a
              href="/api/backup/download"
              download
              className="inline-block px-5 py-2 bg-[#f59e0b] hover:bg-amber-500/90 text-white font-medium rounded-[10px] text-sm transition-colors"
            >
              下载数据库备份 (.db)
            </a>
          </div>

          <div className="card p-4">
            <h3 className="text-sm font-semibold text-[#3d342b] mb-3">🔄 恢复数据</h3>
            <p className="text-xs text-[#6b5d52] mb-3">上传之前下载的 .db 备份文件。恢复前会自动保存当前数据到 backups/ 目录。</p>
            <label className="inline-block bg-[#faf7f2] border border-dashed border-[#d6cec4] rounded-xl p-4 text-center cursor-pointer hover:border-[#f59e0b] transition-colors">
              <span className="text-[#6b5d52] text-sm">选择备份文件 (.db)</span>
              <input
                type="file"
                accept=".db"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!confirm(`确定要用 "${file.name}" 恢复数据吗？当前数据将被覆盖。`)) return;
                  const fd = new FormData();
                  fd.append('file', file);
                  try {
                    const res = await fetch('/api/backup/restore', { method: 'POST', body: fd });
                    const data = await res.json();
                    if (res.ok) {
                      alert(data.message);
                      window.location.reload();
                    } else {
                      alert('恢复失败: ' + (data.error || '未知错误'));
                    }
                  } catch {
                    alert('恢复请求失败');
                  }
                }}
              />
            </label>
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
