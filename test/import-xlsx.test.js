import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { cellId } from '../src/a2-layout.js';
import { importA2 } from '../src/import-xlsx.js';

// A small workbook with an A2 sheet, written at the addresses of the A2 data model.
async function workbook(sheetName, cells) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  for (const [address, value] of Object.entries(cells)) ws.getCell(address).value = value;
  return wb.xlsx.writeBuffer();
}

describe('import of A2 from an .xlsx file', () => {
  it('reads values, codes and the saved result of a formula', async () => {
    const buf = await workbook('A2', {
      V14: 10, W14: '', Y14: '1,200', Z14: 'w', AB14: { formula: 'V14+Y14', result: 1210 }, V15: 'n/a', W15: 'Q',
    });
    const { sheet, values, problems } = await importA2(buf);
    expect(sheet).toBe('A2');
    expect(values.get(cellId('01', 'PUB', 'M'))).toEqual({ value: '10', code: '' });
    expect(values.get(cellId('02', 'PUB', 'M'))).toEqual({ value: '1200', code: 'W' });
    expect(values.get(cellId('0', 'PUB', 'M')).value).toBe('1210');
    expect(values.get(cellId('01', 'PUB', 'F'))).toEqual({ value: '', code: '' });
    expect(problems).toHaveLength(2);
  });
  it('reads a formula with no saved result as empty and counts it', async () => {
    const buf = await workbook('A2', { V14: 4, Y14: 5, AB14: { formula: 'V14+Y14' }, AC14: { formula: 'W14' } });
    const { values, problems, formulas } = await importA2(buf);
    expect(values.get(cellId('0', 'PUB', 'M'))).toEqual({ value: '', code: '' });
    expect(problems).toHaveLength(0);
    expect(formulas).toBe(2);
  });
  it('skips data validations over whole columns quickly', async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('A2');
    ws.getCell('V14').value = 1;
    ws.dataValidations.add('A1:Z1048576', { type: 'decimal', operator: 'greaterThanOrEqual', formulae: [0] });
    const start = Date.now();
    const { values } = await importA2(await wb.xlsx.writeBuffer());
    expect(values.get(cellId('01', 'PUB', 'M')).value).toBe('1');
    expect(Date.now() - start).toBeLessThan(5000);
  });
  it('finds a sheet whose name starts with A2, and reports a missing one', async () => {
    expect((await importA2(await workbook('A2 Students', { V14: 1 }))).sheet).toBe('A2 Students');
    const none = await importA2(await workbook('A1', {}));
    expect(none.sheet).toBe(null);
    expect(none.problems[0]).toMatch(/No sheet named A2/);
  });
});
