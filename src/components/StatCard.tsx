export default function StatCard({ title, value, color }: { title: string; value: string; color: 'green' | 'red' | 'blue' }) {
  const colors = {
    green: 'text-green-400 border-green-800 bg-green-950/30',
    red: 'text-red-400 border-red-800 bg-red-950/30',
    blue: 'text-blue-400 border-blue-800 bg-blue-950/30',
  };

  return (
    <div className={`flex-1 min-w-[120px] rounded-xl border p-4 text-center ${colors[color]}`}>
      <div className="text-xs text-zinc-500 mb-1">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
