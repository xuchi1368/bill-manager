import CountUp from '@/components/CountUp';

export default function StatCard({ title, amount, prefix = '', color }: { title: string; amount: number; prefix?: string; color: 'green' | 'red' | 'blue' }) {
  const styles = {
    green: 'bg-emerald-50 border-emerald-200',
    red: 'bg-rose-50 border-rose-200',
    blue: 'bg-amber-50 border-amber-200',
  };
  const numColors = {
    green: 'text-[#2ea87a]',
    red: 'text-[#e25c3b]',
    blue: 'text-[#3d342b]',
  };

  return (
    <div className={`flex-1 min-w-[100px] rounded-xl border p-3 ${styles[color]} animate-slide-up`}>
      <div className="caption mb-1">{title}</div>
      <div className={`amount-lg text-xl tracking-tight ${numColors[color]}`}>
        <CountUp value={amount} prefix={prefix} />
      </div>
    </div>
  );
}
