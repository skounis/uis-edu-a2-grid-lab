// The layout of the A2 sheet of UIS_ED_A_2026_EN.xlsx: 16 levels across the top, each with a value, a code and a
// comment, and 9 rows of type of institution and sex. The Excel addresses follow "The cells of A2" in the A2 data model of the
// uis-d-platform GitHub repository (docs/architecture/data-model/a2.md): rows 14 to 22, the value of the first level
// in column V, its code in W and its comment in X, then every 3 columns (Y, Z and AA, AB, AC and AD, ...).

// key, programme, ISCED label, and the levels a total level adds up (null for a level the country fills in).
export const LEVELS = [
  ['01', 'Early childhood educational development', 'ISCED 01', null],
  ['02', 'Pre-primary', 'ISCED 02', null],
  ['0', 'All programmes', 'ISCED 0', ['01', '02']],
  ['1', 'All programmes', 'ISCED 1', null],
  ['24', 'General', 'ISCED 24', null],
  ['25', 'Vocational', 'ISCED 25', null],
  ['2', 'All programmes', 'ISCED 2', ['24', '25']],
  ['34', 'General', 'ISCED 34', null],
  ['35', 'Vocational', 'ISCED 35', null],
  ['3', 'All programmes', 'ISCED 3', ['34', '35']],
  ['24+34', 'General', 'ISCED 24+34', ['24', '34']],
  ['25+35', 'Vocational', 'ISCED 25+35', ['25', '35']],
  ['2+3', 'All programmes', 'ISCED 2+3', ['24', '25', '34', '35']],
  ['44', 'General', 'ISCED 44', null],
  ['45', 'Vocational', 'ISCED 45', null],
  ['4', 'All programmes', 'ISCED 4', ['44', '45']],
].map(([key, programme, isced, parts]) => ({ key, programme, isced, parts }));

export const GROUPS = [
  ['Early childhood education', 3], ['Primary', 1], ['Lower secondary', 3],
  ['Upper secondary', 3], ['Total secondary', 3], ['Post-secondary non-tertiary', 3],
].map(([title, levels]) => ({ title, levels }));

export const SECTORS = [['PUB', 'Public institutions'], ['PRIV', 'Private institutions'], ['T', 'Total']];
export const SEXES = [['M', 'Males'], ['F', 'Females'], ['T', 'Males and females']];

// The 9 rows, in the order of the sheet.
export const ROWS = SECTORS.flatMap(([sector, sectorLabel]) =>
  SEXES.map(([sex, sexLabel]) => ({ sector, sectorLabel, sex, sexLabel })));

export const CODES = ['Z', 'M', 'X', 'W'];

// Grid columns: 2 label columns, then a value, a code and a comment column for each level, as in the sheet.
export const LABEL_COLUMNS = 2;
export const KINDS = ['value', 'code', 'comment'];
export const valueColumn = (levelIndex) => LABEL_COLUMNS + 3 * levelIndex;

// Excel addresses.
export const EXCEL_SHEET = 'A2';
export const EXCEL_FIRST_ROW = 14;
const EXCEL_FIRST_VALUE_COLUMN = 22; // V
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
