import { describe, it, expect } from 'vitest';
import { getIconKey, renderIcon, IconTheme } from '../icon-themes';

describe('getIconKey', () => {
  it('maps emoji to semantic key', () => {
    expect(getIconKey('餐饮', '🍜')).toBe('food');
    expect(getIconKey('交通', '🚗')).toBe('transport');
    expect(getIconKey('购物', '🛒')).toBe('shopping');
    expect(getIconKey('娱乐', '🎮')).toBe('entertainment');
  });

  it('falls back to category name when emoji not recognized', () => {
    expect(getIconKey('餐饮', '🍽️')).toBe('food'); // unknown emoji, matches by name
    expect(getIconKey('交通', '')).toBe('transport');
  });

  it('returns "other" for completely unknown category', () => {
    expect(getIconKey('未知分类', '🦄')).toBe('other');
    expect(getIconKey('', '')).toBe('other');
  });

  it('handles undefined categoryIcon gracefully', () => {
    expect(getIconKey('餐饮', undefined)).toBe('food');
    expect(getIconKey('未知', undefined)).toBe('other');
  });
});

describe('renderIcon', () => {
  const themes: IconTheme[] = ['lucide', 'emoji', 'colored'];

  it('returns a React element for every theme + key combination', () => {
    const keys = ['food', 'transport', 'shopping', 'entertainment', 'other'];
    for (const theme of themes) {
      for (const key of keys) {
        const el = renderIcon(theme, key, 16);
        expect(el).toBeDefined();
        expect(typeof el.type).toBeDefined();
      }
    }
  });

  it('lucide theme renders an icon component', () => {
    const el = renderIcon('lucide', 'food', 16);
    expect(el.props.size).toBe(16);
    expect(el.props.strokeWidth).toBe(2);
  });

  it('emoji theme renders a span with emoji text', () => {
    const el = renderIcon('emoji', 'food', 16);
    expect(el.type).toBe('span');
    expect(el.props.style.fontSize).toBe(16);
  });

  it('colored theme renders a div with colored background and white icon', () => {
    const el = renderIcon('colored', 'food', 16);
    expect(el.type).toBe('div');
    expect(el.props.style.backgroundColor).toBe('#2ea87a');
  });

  it('falls back to "other" for unknown keys', () => {
    const el = renderIcon('lucide', 'nonexistent', 16);
    expect(el).toBeDefined();
    expect(el.props.size).toBe(16);
  });

  it('handles different sizes', () => {
    const small = renderIcon('lucide', 'food', 12);
    const large = renderIcon('colored', 'food', 24);
    expect(small.props.size).toBe(12);
    expect(large.props.style.width).toBe(32); // size + 8
  });
});
