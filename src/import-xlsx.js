// Import of the A2 sheet from an Excel questionnaire (.xlsx) into the cells of the grid.
// It reads, for each of the 144 cells, the value and the code at the addresses of the A2 data model
// (see a2-layout.js). A total that is a formula in the sheet is read as the result Excel saved with the file;
// a formula with no saved result is read as empty, and the grid fills it in from its parts.
import ExcelJS from 'exceljs';
import { CELLS, CODES, EXCEL_SHEET } from './a2-layout.js';

// The text of an Excel cell value: a number, a string, a rich text, or the saved result of a formula.
export function cellText(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return v.trim();
  if (typeof v === 'boolean') return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'object') {
    if ('result' in v) return cellText(v.result);
    if ('formula' in v || 'sharedFormula' in v) return '';
    if ('richText' in v) return v.richText.map((r) => r.text).join('').trim();
    if ('text' in v) return String(v.text).trim();
    if ('error' in v) return '';
  }
  return String(v).trim();
}

// The sheet of A2: named A2, or else the first sheet whose name starts with A2.
export function findSheet(workbook) {
  return workbook.getWorksheet(EXCEL_SHEET) ||
    workbook.worksheets.find((ws) => ws.name.trim().toUpperCase().startsWith(EXCEL_SHEET));
}

const isFormula = (v) => v !== null && typeof v === 'object' && ('formula' in v || 'sharedFormula' in v);

// Reads a workbook (ArrayBuffer or Buffer).
// Returns { sheet, values: Map(id -> { value, code }), problems, formulas } where formulas counts the cells that are
// formulas with no saved result.
export async function importA2(buffer) {
  const workbook = new ExcelJS.Workbook();
  // The UIS questionnaire has data validations over whole columns (for example A1:D1048576). ExcelJS expands them
  // cell by cell, which takes minutes, and the import does not need them, so they are skipped.
  await workbook.xlsx.load(buffer, { ignoreNodes: ['dataValidations'] });
  const ws = findSheet(workbook);
  if (!ws) {
    return { sheet: null, values: new Map(), problems: [`No sheet named ${EXCEL_SHEET} in the file.`] };
  }
  const values = new Map();
  const problems = [];
  let formulas = 0;
  for (const c of CELLS) {
    const raw = ws.getCell(c.excelValue).value;
    const rawCode = ws.getCell(c.excelCode).value;
    for (const r of [raw, rawCode]) if (isFormula(r) && !('result' in r)) formulas += 1;
    let value = cellText(raw);
    const code = cellText(rawCode).toUpperCase();
    if (value !== '' && Number.isNaN(Number(value.replace(/[\s,]/g, '')))) {
      problems.push(`${c.excelValue}: "${value}" is not a number, so it was left out.`);
      value = '';
    } else {
      value = value.replace(/[\s,]/g, '');
    }
    if (code !== '' && !CODES.includes(code)) {
      problems.push(`${c.excelCode}: "${code}" is not one of the codes ${CODES.join(', ')}, so it was left out.`);
      values.set(c.id, { value, code: '' });
    } else {
      values.set(c.id, { value, code });
    }
  }
  return { sheet: ws.name, values, problems, formulas };
}
