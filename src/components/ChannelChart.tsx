'use client';

const CHANNEL_ICONS: Record<string, string> = {
  '微信': '💬', '支付宝': '💙', '银行卡': '💳', '现金': '💵', '工资卡': '🏦',
};

const BAR_COLORS = ['#f97316', '#3b82f6', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#6366f1'];

export default function ChannelChart({ data }: { data: { name: string; amount: number }[] }) {
  if (!data.length) return <div className="card p-3"><p className="caption">暂无数据</p></div>;

  const total = data.reduce((s, d) => s + d.amount, 0);
  const maxAmount = Math.max(...data.map(d => d.amount));
  const enriched = data.map((d, i) => ({
    ...d,
    icon: CHANNEL_ICONS[d.name] || '💳',
    pct: total > 0 ? Math.round((d.amount / total) * 100) : 0,
    color: BAR_COLORS[i % BAR_COLORS.length],
    widthPct: maxAmount > 0 ? (d.amount / maxAmount) * 100 : 0,
  }));

  return (
    <div className="card p-3">
      <h3 className="section-title text-xs mb-2">渠道支出分布</h3>

      <div className="space-y-2">
        {enriched.map(ch => (
          <div key={ch.name} className="flex items-center gap-2">
            <span className="text-base w-6 text-center">{ch.icon}</span>
            <span className="text-[12px] text-[#3d342b] w-12 flex-shrink-0 font-medium">{ch.name}</span>
            <div className="flex-1 h-5 bg-[#f5f2ed] rounded-full overflow-hidden relative">
              <div className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.max(ch.widthPct, 8)}%`,
                  background: `linear-gradient(90deg, ${ch.color}dd, ${ch.color})`,
                }}
              />
              <span className="absolute inset-0 flex items-center px-2 text-[10px] text-white font-semibold" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
                {ch.pct}%
              </span>
            </div>
            <span className="amount text-xs text-[#3d342b] w-16 text-right">
              ¥{ch.amount.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {enriched.length >= 1 && (
        <div className="mt-2 pt-2 border-t border-[#f5f2ed]">
          <p className="caption leading-relaxed">
            {enriched[0].icon} <span className="text-[#3d342b] font-semibold">{enriched[0].name}</span> 占比最高
            {enriched[0].pct >= 60 ? '，是主要支出渠道' : ''}
            {enriched.length > 1 && (
              <> · 共 {enriched.length} 个渠道，合计 <span className="amount text-[#3d342b]">¥{total.toLocaleString()}</span></>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
