interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  note?: string | null;
  category: { name: string; icon: string };
  channel: { name: string };
}

export default function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
            <th className="text-left p-3">日期</th>
            <th className="text-left p-3">类型</th>
            <th className="text-left p-3">分类</th>
            <th className="text-left p-3">渠道</th>
            <th className="text-left p-3">备注</th>
            <th className="text-right p-3">金额</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
              <td className="p-3 text-zinc-400">{t.date}</td>
              <td className={`p-3 ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                {t.type === 'income' ? '收入' : '支出'}
              </td>
              <td className="p-3">
                {t.category.icon} {t.category.name}
              </td>
              <td className="p-3 text-zinc-400">{t.channel.name}</td>
              <td className="p-3 text-zinc-500">{t.note || '-'}</td>
              <td className={`p-3 text-right font-medium ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                {t.type === 'income' ? '+' : '-'}{t.amount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
