// Writes a small .xlsx with an A2 sheet at the addresses of the A2 data model, to try the import without a real
// questionnaire. Usage: npm run sample (writes test/data/sample-a2.xlsx).
import ExcelJS from 'exceljs';
import { mkdirSync } from 'node:fs';

const out = process.argv[2] || 'test/data/sample-a2.xlsx';
const wb = new ExcelJS.Workbook();
const ws = wb.addWorksheet('A2');
const cells = {
  V14: 10, Y14: 20, AB14: { formula: 'V14+Y14', result: 30 },
  V15: 5, Y15: 7, AB15: { formula: 'V15+Y15', result: 12 },
  V17: 3, W18: 'M', AE14: 'abc',
};
for (const [address, value] of Object.entries(cells)) ws.getCell(address).value = value;
mkdirSync(out.split('/').slice(0, -1).join('/') || '.', { recursive: true });
await wb.xlsx.writeFile(out);
console.log(`Wrote ${out}`);
