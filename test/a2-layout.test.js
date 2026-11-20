import { describe, expect, it } from 'vitest';
import { CELLS, TOTALS, cell, columnLetter } from '../src/a2-layout.js';

describe('A2 layout', () => {
  it('has 144 cells and 108 totals', () => {
    expect(CELLS).toHaveLength(144);
    expect(TOTALS).toHaveLength(108);
    expect(CELLS.filter((c) => !c.total)).toHaveLength(36);
  });
  it('uses the Excel addresses of the A2 data model', () => {
    expect(columnLetter(22)).toBe('V');
    expect(columnLetter(27)).toBe('AA');
    expect([cell('01', 'PUB', 'M').excelValue, cell('01', 'PUB', 'M').excelCode]).toEqual(['V14', 'W14']);
    expect(cell('01', 'T', 'T').excelValue).toBe('V22');
    expect([cell('02', 'PUB', 'M').excelValue, cell('02', 'PUB', 'M').excelCode]).toEqual(['Y14', 'Z14']);
    expect([cell('0', 'PUB', 'M').excelValue, cell('0', 'PUB', 'M').excelCode]).toEqual(['AB14', 'AC14']);
    expect(cell('24+34', 'PUB', 'M').excelValue).toBe('AZ14');
    expect([cell('4', 'PUB', 'M').excelValue, cell('4', 'PUB', 'M').excelCode]).toEqual(['BO14', 'BP14']);
  });
  it('puts every total after the totals it is made of', () => {
    const seen = new Set(CELLS.filter((c) => !c.total).map((c) => c.id));
    for (const t of TOTALS) {
      for (const p of t.parts) expect(seen.has(p)).toBe(true);
      seen.add(t.total);
    }
  });
});
