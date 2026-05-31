import cron from 'node-cron';
import { db } from '@/lib/db';

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getNextDue(frequency: string, dayOfMonth: number): string {
  const now = new Date();
  switch (frequency) {
    case 'daily':
      return addDays(now, 1);
    case 'weekly':
      return addDays(now, 7);
    case 'monthly': {
      const d = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
      if (d <= now) d.setMonth(d.getMonth() + 1);
      return d.toISOString().split('T')[0];
    }
    case 'yearly': {
      const d = new Date(now.getFullYear(), 0, dayOfMonth);
      if (d <= now) d.setFullYear(d.getFullYear() + 1);
      return d.toISOString().split('T')[0];
    }
    default:
      return addDays(now, 30);
  }
}

export function startCronJob() {
  cron.schedule('0 2 * * *', async () => {
    console.log('[cron] checking recurring rules...');
    const today = new Date().toISOString().split('T')[0];

    const rules = await db.recurringRule.findMany({
      where: { isActive: true, nextDueDate: { lte: today } },
    });

    for (const rule of rules) {
      await db.transaction.create({
        data: {
          type: rule.type,
          amount: rule.amount,
          date: today,
          note: `[周期] ${rule.name}`,
          categoryId: rule.categoryId,
          channelId: rule.channelId,
          userId: rule.userId,
        },
      });

      const nextDue = getNextDue(rule.frequency, rule.dayOfMonth);
      await db.recurringRule.update({
        where: { id: rule.id },
        data: { nextDueDate: nextDue },
      });

      console.log(`[cron] created: ${rule.name} (next: ${nextDue})`);
    }
  });

  console.log('[cron] recurring bill checker started');
}
