// The A2 grid: Jspreadsheet CE set up with the layout of the A2 sheet, the totals and the checks.
import jspreadsheet from 'jspreadsheet-ce';
import 'jsuites/dist/jsuites.css';
import 'jspreadsheet-ce/dist/jspreadsheet.css';
import { CELLS, CODES, GROUPS, LABEL_COLUMNS, LEVELS, ROWS, TOTALS, columnLetter } from './a2-layout.js';
import { fill, snapshot } from './totals.js';
import { check } from './checks.js';

const byPosition = new Map(); // "x:y" -> { cell, isCode }
for (const c of CELLS) {
  byPosition.set(`${c.x}:${c.y}`, { cell: c, isCode: false });
  byPosition.set(`${c.x + 1}:${c.y}`, { cell: c, isCode: true });
}

function columns() {
  const cols = [
    { type: 'text', title: 'Type of institution', width: 130, readOnly: true },
    { type: 'text', title: 'Sex', width: 125, readOnly: true },
  ];
  for (let i = 0; i < LEVELS.length; i += 1) {
    cols.push({ type: 'text', title: 'Value', width: 58, align: 'right' });
    cols.push({ type: 'dropdown', title: 'Code', width: 40, align: 'center', source: CODES, autocomplete: false });
  }
  return cols;
}

function headers() {
  return [
    [{ title: '', colspan: LABEL_COLUMNS }, ...GROUPS.map((g) => ({ title: g.title, colspan: 2 * g.levels }))],
    [{ title: '', colspan: LABEL_COLUMNS }, ...LEVELS.map((l) => ({ title: `${l.programme} (${l.isced})`, colspan: 2 }))],
  ];
}

function emptyData() {
  return ROWS.map((r, i) => [i % 3 === 0 ? r.sectorLabel : '', r.sexLabel, ...LEVELS.flatMap(() => ['', ''])]);
}

// The fills of the A2 sheet: a total value light blue, its code darker blue.
function styles() {
  const style = {};
  for (const c of CELLS) {
    if (!c.total) continue;
    style[`${columnLetter(c.x + 1)}${c.y + 1}`] = 'background-color: #DCE6F1;';
    style[`${columnLetter(c.x + 2)}${c.y + 1}`] = 'background-color: #95B3D7;';
  }
  return style;
}

const clean = (isCode, v) => {
  const s = v === null || v === undefined ? '' : String(v).trim();
  return isCode ? s.toUpperCase() : s.replace(/[\s,\u00a0]/g, '');
};

export function createGrid(host, { onChange } = {}) {
  let quiet = false;
  let before = null;
  let changed = [];

  const sheets = jspreadsheet(host, {
    worksheets: [{
      data: emptyData(),
      columns: columns(),
      nestedHeaders: headers(),
      style: styles(),
      freezeColumns: LABEL_COLUMNS,
      tableOverflow: true,
      tableWidth: '100%',
      columnSorting: false,
      columnDrag: false,
      rowDrag: false,
      allowInsertRow: false,
      allowInsertColumn: false,
      allowDeleteRow: false,
      allowDeleteColumn: false,
      allowRenameColumn: false,
      allowManualInsertRow: false,
      allowManualInsertColumn: false,
      selectionCopy: false,
      parseFormulas: false,
    }],
    about: false,
    onbeforechange: (ws, td, x, y, value) => {
      const pos = byPosition.get(`${x}:${y}`);
      if (quiet || !pos) return undefined;
      if (before === null) before = snapshot(get, TOTALS);
      return clean(pos.isCode, value);
    },
    onchange: (ws, td, x, y) => {
      const pos = byPosition.get(`${x}:${y}`);
      if (!quiet && pos) changed.push(pos.cell.id);
    },
    // Once per change, and once for a whole pasted block: fill in the totals, then run the checks.
    onafterchanges: () => {
      if (quiet || !changed.length) return;
      const ids = changed;
      const b = before || snapshot(get, TOTALS);
      changed = [];
      before = null;
      setValues(new Map(fill(get, TOTALS, ids, b).map(([id, value]) => [id, { ...get(id), value }])));
      refreshChecks();
      if (onChange) onChange();
    },
  });
  const ws = sheets[0];
  ws.hideIndex();

  // A single click on a code cell opens its list. The arrow keys still move without opening it.
  host.addEventListener('click', (ev) => {
    const td = ev.target.closest && ev.target.closest('tbody td');
    if (!td || !host.contains(td) || ws.edition) return;
    const pos = byPosition.get(`${td.dataset.x}:${td.dataset.y}`);
    if (pos && pos.isCode) ws.openEditor(td, false, ev);
  });

  function get(id) {
    const c = CELLS.find((k) => k.id === id);
    const s = (v) => (v === null || v === undefined ? '' : String(v));
    return { value: s(ws.getValueFromCoords(c.x, c.y)), code: s(ws.getValueFromCoords(c.x + 1, c.y)).toUpperCase() };
  }

  // Writes values into the grid without starting the totals (used by the import and by the totals themselves).
  function setValues(values) {
    quiet = true;
    try {
      for (const [id, v] of values) {
        const c = CELLS.find((k) => k.id === id);
        ws.setValueFromCoords(c.x, c.y, v.value ?? '', true);
        if ('code' in v) ws.setValueFromCoords(c.x + 1, c.y, v.code ?? '', true);
      }
    } finally {
      quiet = false;
    }
  }

  function refreshChecks() {
    const msgs = check(get, TOTALS);
    for (const c of CELLS) {
      for (const [dx, key] of [[0, 'value'], [1, 'code']]) {
        const td = ws.getCellFromCoords(c.x + dx, c.y);
        const m = msgs.get(`${c.id}:${key}`);
        td.classList.toggle('a2-check', Boolean(m));
        if (m) td.title = m.join('\n'); else td.removeAttribute('title');
      }
    }
    return msgs;
  }

  function values() {
    return new Map(CELLS.map((c) => [c.id, get(c.id)]));
  }

  function clear() {
    setValues(new Map(CELLS.map((c) => [c.id, { value: '', code: '' }])));
    refreshChecks();
  }

  refreshChecks();
  return { ws, get, setValues, values, refreshChecks, clear };
}
