import { describe, it, expect } from 'vitest';
import { cn, formatMoney, getCurrentMonth } from '../utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('filters falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b');
  });

  it('handles Tailwind conflicts with twMerge', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('formatMoney', () => {
  it('formats positive amounts with + sign', () => {
    expect(formatMoney(100)).toBe('+100.00');
    expect(formatMoney(0)).toBe('+0.00');
  });

  it('formats negative amounts with - sign', () => {
    expect(formatMoney(-100)).toBe('-100.00');
  });
});

describe('getCurrentMonth', () => {
  it('returns [start, end] date strings in local timezone', () => {
    const [start, end] = getCurrentMonth();
    const now = new Date();
    expect(start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(end).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // start should be the 1st of current month
    expect(start.endsWith('-01')).toBe(true);
    // end should be within current year/month
    expect(start.slice(0, 7)).toBe(end.slice(0, 7));
  });
});
