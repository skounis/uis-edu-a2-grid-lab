// The layout of the A2 sheet of UIS_ED_A_2026_EN.xlsx: 16 levels across the top, each with a value, a code and a
// comment, and 9 rows of type of institution and sex. It is read from two input files in config/:
//   a2-step1-input.json  the layout of the sheet, the totals and where the cells are in the Excel (SHEET), a copy of
//                        docs/architecture/forms/edu-a/a2-step1-input.json of the uis-d-platform GitHub repository
//   a2-lab-input.json    what the grid of the lab shows: columns, codes and fills
import input from '../config/a2-step1-input.json';
import lab from '../config/a2-lab-input.json';
export { lab };

// key, programme, ISCED label, and the levels a total level adds up (null for a level the country fills in).
export const LEVELS = input.COLS.map(({ key, programme, isced, parts }) => ({ key, programme, isced, parts }));

export const GROUPS = input.GROUPS.map(({ title, columns }) => ({ title, levels: columns }));

export const SECTORS = input.ROWS.map(({ key, label }) => [key, label]);
export const SEXES = input.SEXES.map(({ key, label }) => [key, label]);

// The 9 rows, in the order of the sheet.
export const ROWS = SECTORS.flatMap(([sector, sectorLabel]) =>
  SEXES.map(([sex, sexLabel]) => ({ sector, sectorLabel, sex, sexLabel })));

export const CODES = lab.CODE_COLUMN.codes;

// Grid columns: the label columns, then a value, a code and a comment column for each level, as in the sheet.
export const LABEL_COLUMNS = lab.LABEL_COLUMNS.length;
export const KINDS = ['value', 'code', 'comment'];
if (KINDS.length !== input.SHEET.columns_per_level) throw new Error('SHEET.columns_per_level must be 3');
export const valueColumn = (levelIndex) => LABEL_COLUMNS + KINDS.length * levelIndex;

// Excel addresses.
export const EXCEL_SHEET = input.SHEET.name;
export const EXCEL_FIRST_ROW = input.SHEET.first_row;
const EXCEL_FIRST_VALUE_COLUMN = columnNumber(input.SHEET.first_value_column);
function columnNumber(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + ch.charCodeAt(0) - 64;
  return n;
}
export function columnLetter(n) {
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}
// The Excel address of the value (kind 'value'), code or comment of a cell.
export function excelAddress(levelIndex, rowIndex, kind = 'value') {
  const col = EXCEL_FIRST_VALUE_COLUMN + 3 * levelIndex + KINDS.indexOf(kind);
  return columnLetter(col) + (EXCEL_FIRST_ROW + rowIndex);
}

export function isTotalCell(level, row) {
  return Boolean(level.parts) || row.sector === 'T' || row.sex === 'T';
}

// The 144 cells, each with its grid position (x is the value column; the code and comment follow) and its Excel
// addresses.
export const CELLS = LEVELS.flatMap((level, li) => ROWS.map((row, ri) => ({
  id: `${level.key}|${row.sector}|${row.sex}`,
  level, row,
  x: valueColumn(li), y: ri,
  excelValue: excelAddress(li, ri), excelCode: excelAddress(li, ri, 'code'), excelComment: excelAddress(li, ri, 'comment'),
  total: isTotalCell(level, row),
})));
const CELL_BY_ID = new Map(CELLS.map((c) => [c.id, c]));
export const cellId = (levelKey, sector, sex) => `${levelKey}|${sector}|${sex}`;
export const cell = (levelKey, sector, sex) => CELL_BY_ID.get(cellId(levelKey, sector, sex));

// The 108 totals and their parts, as in the sheet: a Total row adds up Public and Private, a Males and females row
// adds up Males and Females, and a total level adds up its levels. In this order a total always comes after the
// totals it is made of.
export const TOTALS = LEVELS.flatMap((level) => ROWS.flatMap(({ sector, sex }) => {
  let parts;
  if (sector === 'T') parts = [cellId(level.key, 'PUB', sex), cellId(level.key, 'PRIV', sex)];
  else if (sex === 'T') parts = [cellId(level.key, sector, 'M'), cellId(level.key, sector, 'F')];
  else if (level.parts) parts = level.parts.map((p) => cellId(p, sector, sex));
  else return [];
  return [{ total: cellId(level.key, sector, sex), parts }];
}));
