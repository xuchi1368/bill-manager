import { startCronJob } from '@/lib/cron';

let registered = false;

export function register() {
  if (registered) return;
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    startCronJob();
    registered = true;
  }
}
