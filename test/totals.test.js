import { describe, expect, it } from 'vitest';
import { TOTALS, cellId } from '../src/a2-layout.js';
import { expected, fill, snapshot } from '../src/totals.js';

const store = (entries) => {
  const m = new Map(entries.map(([id, value, code = '']) => [id, { value, code }]));
  return (id) => m.get(id) || { value: '', code: '' };
};
const total = (id) => TOTALS.find((t) => t.total === id);

describe('totals', () => {
  it('adds up the parts, leaves X out, and stays empty with M or an empty part', () => {
    const t = total(cellId('0', 'PUB', 'M'));
    expect(expected(store([[cellId('01', 'PUB', 'M'), '10'], [cellId('02', 'PUB', 'M'), '20']]), t)).toBe(30);
    expect(expected(store([[cellId('01', 'PUB', 'M'), '10'], [cellId('02', 'PUB', 'M'), '', 'X']]), t)).toBe(10);
    expect(expected(store([[cellId('01', 'PUB', 'M'), '10'], [cellId('02', 'PUB', 'M'), '', 'M']]), t)).toBe(null);
    expect(expected(store([[cellId('01', 'PUB', 'M'), '10']]), t)).toBe(null);
  });
  it('fills a total of totals in one pass and keeps a total the country typed', () => {
    const entries = [
      [cellId('01', 'PUB', 'M'), '10'], [cellId('02', 'PUB', 'M'), '20'],
      [cellId('01', 'PUB', 'F'), '5'], [cellId('02', 'PUB', 'F'), '7'],
    ];
    const get = store(entries);
    const before = snapshot(store([]), TOTALS);
    const out = new Map(fill(get, TOTALS, entries.map((e) => e[0]), before));
    expect(out.get(cellId('0', 'PUB', 'M'))).toBe('30');
    expect(out.get(cellId('01', 'PUB', 'T'))).toBe('15');
    expect(out.get(cellId('0', 'PUB', 'T'))).toBe('42');
    const typed = store([...entries, [cellId('0', 'PUB', 'M'), '99']]);
    const kept = new Map(fill(typed, TOTALS, [cellId('01', 'PUB', 'M')], snapshot(typed, TOTALS)));
    expect(kept.has(cellId('0', 'PUB', 'M'))).toBe(false);
  });
});
