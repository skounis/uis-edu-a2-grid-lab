import { describe, expect, it } from 'vitest';
import { TOTALS, cellId } from '../src/a2-layout.js';
import { check } from '../src/checks.js';
import { refusal, clean } from '../src/entry-rules.js';

const store = (entries) => {
  const m = new Map(entries.map(([id, value, code = '', comment = '']) => [id, { value, code, comment }]));
  return (id) => m.get(id) || { value: '', code: '', comment: '' };
};
const id = cellId('01', 'PUB', 'M');

describe('entry rules 1 to 3', () => {
  it('refuses text, negative numbers, unknown codes and comments of the wrong length', () => {
    expect(refusal('value', clean('value', '1 200'))).toBe('');
    expect(refusal('value', 'n/a')).not.toBe('');
    expect(refusal('value', '-5')).not.toBe('');
    expect(refusal('code', clean('code', 'w'))).toBe('');
    expect(refusal('code', 'N')).not.toBe('');
    expect(refusal('comment', 'x')).not.toBe('');
    expect(refusal('comment', 'x'.repeat(501))).not.toBe('');
    expect(refusal('comment', 'ok')).toBe('');
  });
});

describe('checks', () => {
  it('rule 4: value and code agree', () => {
    expect(check(store([[id, '0', 'M']]), TOTALS).has(`${id}:value`)).toBe(true);
    expect(check(store([[id, '0', 'Z']]), TOTALS).has(`${id}:value`)).toBe(false);
    expect(check(store([[id, '', 'W', 'Includes 02']]), TOTALS).has(`${id}:value`)).toBe(true);
  });
  it('rule 5: X and W need a comment', () => {
    expect(check(store([[id, '', 'X']]), TOTALS).get(`${id}:comment`)).toHaveLength(1);
    expect(check(store([[id, '', 'X', 'Counted in ISCED 02']]), TOTALS).has(`${id}:comment`)).toBe(false);
    expect(check(store([[id, '5', 'W']]), TOTALS).has(`${id}:code`)).toBe(true);
  });
  it('rules 6 to 9: a total matches its parts and gets the code of its parts', () => {
    const f = cellId('01', 'PUB', 'F');
    const t = cellId('01', 'PUB', 'T');
    expect(check(store([[id, '10'], [f, '5'], [t, '16']]), TOTALS).get(`${t}:value`)[0]).toMatch(/add up to 15/);
    expect(check(store([[id, '10'], [f, '5'], [t, '15']]), TOTALS).has(`${t}:value`)).toBe(false);
    expect(check(store([[id, '', 'M'], [f, '5']]), TOTALS).get(`${t}:code`)[0]).toMatch(/coded M/);
  });
});
