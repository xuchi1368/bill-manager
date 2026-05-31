import { NextRequest, NextResponse } from 'next/server';
import iconv from 'iconv-lite';
import * as XLSX from 'xlsx';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { matchCategory as matchCategoryByRule } from '@/lib/categorization';

function parseXLSX(buffer: Buffer): string[][] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
  return data.filter((row: string[]) => row.some(c => c !== ''));
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  for (const line of lines) {
    const cols: string[] = [];
    let col = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        cols.push(col.trim());
        col = '';
      } else {
        col += ch;
      }
    }
    cols.push(col.trim());
    if (cols.length > 1) rows.push(cols);
  }
  return rows;
}

// WeChat CSV columns: 交易时间, 交易类型, 交易对方, 商品, 收/支, 金额(元), 支付方式, ...
// Alipay CSV columns: 交易时间, 交易分类, 交易对方, 商品说明, 收/支, 金额, 收/付款方式, ...

function detectFormat(headers: string[]): 'wechat' | 'alipay' | null {
  const h = headers.join(',');
  if (h.includes('金额(元)') || (h.includes('收/支') && h.includes('支付方式'))) return 'wechat';
  if (h.includes('收/付款方式') || (h.includes('商品说明') && h.includes('收/支'))) return 'alipay';
  return null;
}

const DEFAULT_KEYWORDS: Record<string, { name: string; icon: string }> = {
  '餐饮': { name: '餐饮', icon: '🍜' },
  '美团': { name: '餐饮', icon: '🍜' },
  '饿了么': { name: '餐饮', icon: '🍜' },
  '外卖': { name: '餐饮', icon: '🍜' },
  '超市': { name: '购物', icon: '🛒' },
  '淘宝': { name: '购物', icon: '🛒' },
  '京东': { name: '购物', icon: '🛒' },
  '拼多多': { name: '购物', icon: '🛒' },
  '滴滴': { name: '交通', icon: '🚗' },
  '公交': { name: '交通', icon: '🚗' },
  '地铁': { name: '交通', icon: '🚗' },
  '打车': { name: '交通', icon: '🚗' },
  '加油': { name: '交通', icon: '🚗' },
  '水电': { name: '住房', icon: '🏠' },
  '燃气': { name: '住房', icon: '🏠' },
  '物业': { name: '住房', icon: '🏠' },
  '话费': { name: '通讯', icon: '📱' },
  '手机': { name: '通讯', icon: '📱' },
  '电影': { name: '娱乐', icon: '🎬' },
  '视频': { name: '娱乐', icon: '🎬' },
  '游戏': { name: '娱乐', icon: '🎮' },
  '医院': { name: '医疗', icon: '💊' },
  '药': { name: '医疗', icon: '💊' },
  '工资': { name: '工资', icon: '💰' },
  '利息': { name: '投资收益', icon: '📈' },
  '理财': { name: '投资收益', icon: '📈' },
  '红包': { name: '其他收入', icon: '🎁' },
  '退款': { name: '其他收入', icon: '🎁' },
  '转账': { name: '转账', icon: '💳' },
};

function matchCategory(description: string, note: string): { name: string; icon: string } {
  const text = `${description} ${note}`;
  for (const [keyword, match] of Object.entries(DEFAULT_KEYWORDS)) {
    if (text.includes(keyword)) return match;
  }
  return { name: '', icon: '📦' };
}

function normalizeType(raw: string): 'expense' | 'income' {
  if (raw.includes('收入') || raw === '收') return 'income';
  return 'expense';
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: '请先登录' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: '请选择文件' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name.toLowerCase();
    const isXLSX = fileName.endsWith('.xlsx');

    let allRows: string[][];

    if (isXLSX) {
      // WeChat: .xlsx Excel format
      allRows = parseXLSX(buffer);
    } else {
      // Alipay: .csv format (UTF-8 or GBK)
      const tryDecode = (encoding: 'utf-8' | 'gbk') => {
        return encoding === 'utf-8' ? buffer.toString('utf-8') : iconv.decode(buffer, 'gbk');
      };

      let text = tryDecode('utf-8');
      allRows = parseCSV(text);

      if (allRows.length < 2) {
        text = tryDecode('gbk');
        allRows = parseCSV(text);
      }
    }

    if (allRows.length < 2) return NextResponse.json({ error: '无法解析文件，请确认是微信或支付宝账单' }, { status: 400 });

    // Find the actual header row (skip metadata rows)
    let headerRowIdx = -1;
    for (let i = 0; i < allRows.length; i++) {
      const r = allRows[i].join(',');
      if (r.includes('交易时间') && (r.includes('金额') || r.includes('收/支'))) {
        headerRowIdx = i;
        break;
      }
    }

    if (headerRowIdx < 0) return NextResponse.json({ error: '无法识别账单格式，请使用微信或支付宝导出的原始账单' }, { status: 400 });

    const useHeaders = allRows[headerRowIdx];
    const finalFormat = isXLSX ? 'wechat' : detectFormat(useHeaders);
    if (!finalFormat) return NextResponse.json({ error: '无法识别账单格式，请使用微信或支付宝导出的原始账单' }, { status: 400 });
    let timeIdx: number, typeIdx: number, counterpartyIdx: number, descIdx: number, inoutIdx: number, amountIdx: number, methodIdx: number;
    if (finalFormat === 'wechat') {
      timeIdx = useHeaders.findIndex((h) => h.includes('交易时间'));
      typeIdx = useHeaders.findIndex((h) => h.includes('交易类型'));
      counterpartyIdx = useHeaders.findIndex((h) => h.includes('交易对方'));
      descIdx = useHeaders.findIndex((h) => h.includes('商品') || h.includes('说明'));
      inoutIdx = useHeaders.findIndex((h) => h.includes('收/支') || h.includes('收支'));
      amountIdx = useHeaders.findIndex((h) => h.includes('金额'));
      methodIdx = useHeaders.findIndex((h) => h.includes('支付方式'));
    } else {
      timeIdx = headers.findIndex((h) => h.includes('交易时间'));
      typeIdx = headers.findIndex((h) => h.includes('交易分类'));
      counterpartyIdx = headers.findIndex((h) => h.includes('交易对方'));
      descIdx = headers.findIndex((h) => h.includes('商品说明'));
      inoutIdx = headers.findIndex((h) => h.includes('收/支'));
      amountIdx = headers.findIndex((h) => h.includes('金额'));
      methodIdx = headers.findIndex((h) => h.includes('收/付款方式'));
    }

    // Get all categories, channels, and user rules for matching
    const categories = await db.category.findMany({ where: { userId } });
    const channels = await db.channel.findMany({ where: { userId } });
    const userRules = await db.categorizationRule.findMany({
      where: { isActive: true, userId },
      include: { category: true, channel: true },
      orderBy: { priority: 'desc' },
    });

    const transactions: {
      date: string;
      type: string;
      amount: number;
      counterparty: string;
      description: string;
      method: string;
      matchedCategory: string;
      matchedCategoryIcon: string;
      categoryId: string;
      matchedChannel: string;
      channelId: string;
    }[] = [];

    for (let i = headerRowIdx + 1; i < allRows.length; i++) {
      const row = allRows[i];
      if (row.length < 3) continue;

      const rawType = inoutIdx >= 0 ? row[inoutIdx] : '';
      // Skip Alipay "不计收支" (neutral) transactions
      if (rawType.includes('不计收支') || rawType.includes('不计')) continue;
      const type = normalizeType(rawType);
      if (!type) continue;

      const amountStr = row[amountIdx]?.replace(/[¥￥,]/g, '').replace('�', '') || '0';
      const amount = parseFloat(amountStr);
      if (isNaN(amount) || amount === 0) continue;

      const counterparty = counterpartyIdx >= 0 ? row[counterpartyIdx] : '';
      const description = descIdx >= 0 ? row[descIdx] : '';
      const method = methodIdx >= 0 ? row[methodIdx] : '';
      const dateRaw = timeIdx >= 0 ? String(row[timeIdx]) : '';

      // Normalize date
      let date = '';
      // Try Excel serial number (WeChat XLSX)
      const excelNum = parseFloat(dateRaw);
      if (!isNaN(excelNum) && excelNum > 40000 && excelNum < 60000) {
        // Excel date serial: days since 1900-01-01 (with the 1900 leap year bug)
        const d = new Date(Math.round((excelNum - 25569) * 86400 * 1000));
        date = d.toISOString().split('T')[0];
      } else {
        const dateMatch = dateRaw.match(/(\d{4})[-./年](\d{1,2})[-./月](\d{1,2})/);
        if (dateMatch) {
          date = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`;
        }
      }
      if (!date) continue;

      // Match category — user rules take priority over hardcoded keywords
      const searchText = `${counterparty} ${description} ${rawType}`;
      let matched = matchCategory(searchText, '');
      let matchedRuleId: string | null = null;

      // Check user-defined rules first (higher priority) — keyword + amount + channel
      for (const rule of userRules) {
        // Keyword match
        if (!searchText.includes(rule.keyword)) continue;
        // Amount range check (if specified)
        if (rule.amountMin != null && amount < rule.amountMin) continue;
        if (rule.amountMax != null && amount > rule.amountMax) continue;
        // Channel match (if specified)
        if (rule.channelId) {
          const ruleChannel = channels.find(c => c.id === rule.channelId);
          if (ruleChannel && !method.includes(ruleChannel.name) && !ruleChannel.name.includes(method)) continue;
        }
        matched = { name: rule.category.name, icon: rule.category.icon };
        matchedRuleId = rule.id;
        break;
      }

      let categoryId = '';
      const cat = categories.find((c) => c.name === matched.name && c.type === type);
      if (cat) categoryId = cat.id;

      // Match channel
      let channelId = '';
      const ch = channels.find((c) => method.includes(c.name) || c.name.includes(method));
      if (ch) channelId = ch.id;

      transactions.push({
        date,
        type,
        amount,
        counterparty,
        description,
        method,
        matchedCategory: matched.name,
        matchedCategoryIcon: matched.icon,
        categoryId,
        matchedChannel: ch?.name || method,
        channelId,
      });
    }

    return NextResponse.json({ format, transactions });
  } catch (e) {
    return NextResponse.json({ error: `解析失败: ${(e as Error).message}` }, { status: 500 });
  }
}
