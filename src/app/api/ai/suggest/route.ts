import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const apiKey = process.env.AI_API_KEY;
  const endpoint = process.env.AI_API_ENDPOINT;
  const model = process.env.AI_MODEL || 'gpt-4o-mini';

  if (!apiKey) {
    return NextResponse.json({ error: 'AI API 未配置，请在 .env 中设置 AI_API_KEY' }, { status: 400 });
  }

  let body: { transactions: { index: number; description: string; amount: number }[]; categories: { id: string; name: string; icon: string; type: string }[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 });
  }

  const { transactions, categories } = body;
  if (!transactions?.length || !categories?.length) {
    return NextResponse.json({ error: '缺少 transactions 或 categories' }, { status: 400 });
  }

  const catList = categories.map((c) => `${c.id}: ${c.icon} ${c.name} (${c.type === 'expense' ? '支出' : '收入'})`).join('\n');

  const prompt = `你是一个记账分类助手。根据交易描述，将每条交易分类到最合适的类别。

可用类别：
${catList}

交易列表：
${transactions.map((t) => `[${t.index}] ¥${t.amount} - ${t.description}`).join('\n')}

请返回 JSON 数组，格式为：[{"index": 0, "categoryId": "xxx", "confidence": 0.95}, ...]
- index: 交易序号
- categoryId: 类别 ID
- confidence: 置信度 (0-1)
- 只返回 JSON，不要其他内容`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    const res = await fetch(endpoint!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are a financial transaction classifier. Always respond with valid JSON arrays only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json({ error: `AI API 请求失败 (${res.status}): ${errText.slice(0, 200)}` }, { status: 502 });
    }

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || '';
    const jsonMatch = raw.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: `AI 返回格式无法解析: ${raw.slice(0, 200)}` }, { status: 502 });
    }

    const suggestions = JSON.parse(jsonMatch[0]);

    // Validate and enrich
    const validSuggestions = suggestions
      .filter((s: any) =>
        typeof s.index === 'number' &&
        typeof s.categoryId === 'string' &&
        typeof s.confidence === 'number' &&
        s.confidence >= 0 && s.confidence <= 1
      )
      .map((s: any) => {
        const cat = categories.find((c) => c.id === s.categoryId);
        return {
          index: s.index,
          categoryId: s.categoryId,
          categoryName: cat?.name || '未知',
          categoryIcon: cat?.icon || '❓',
          confidence: Math.round(s.confidence * 100),
        };
      });

    return NextResponse.json({ suggestions: validSuggestions });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return NextResponse.json({ error: 'AI API 请求超时' }, { status: 504 });
    }
    return NextResponse.json({ error: `AI 请求异常: ${err.message}` }, { status: 500 });
  }
}
