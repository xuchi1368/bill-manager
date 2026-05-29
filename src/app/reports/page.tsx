'use client';

import { useEffect, useState } from 'react';
import ChannelChart from '@/components/ChannelChart';

export default function ReportsPage() {
  const [channelData, setChannelData] = useState<{ name: string; amount: number }[]>([]);

  useEffect(() => {
    fetch('/api/reports')
      .then((r) => r.json())
      .then((d) => setChannelData(d.channelDistribution || []));
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-6">📈 报表分析</h2>
      <ChannelChart data={channelData} />
    </div>
  );
}
