// The A2 grid: Jspreadsheet CE set up with the layout of the A2 sheet, the totals and the checks.
import jspreadsheet from 'jspreadsheet-ce';
import 'jsuites/dist/jsuites.css';
import 'jspreadsheet-ce/dist/jspreadsheet.css';
import { CELLS, CODES, GROUPS, KINDS, LABEL_COLUMNS, LEVELS, ROWS, TOTALS, columnLetter } from './a2-layout.js';
import { fill, snapshot } from './totals.js';
import { check } from './checks.js';
import { clean, refusal } from './entry-rules.js';

const byPosition = new Map(); // "x:y" -> { cell, kind }
for (const c of CELLS) KINDS.forEach((kind, dx) => byPosition.set(`${c.x + dx}:${c.y}`, { cell: c, kind }));
const BY_ID = new Map(CELLS.map((c) => [c.id, c]));

function columns() {
  const cols = [
    { type: 'text', title: 'Type of institution', width: 130, readOnly: true },
    { type: 'text', title: 'Sex', width: 125, readOnly: true },
  ];
  for (let i = 0; i < LEVELS.length; i += 1) {
    cols.push({ type: 'text', title: 'Value', width: 58, align: 'right' });
    cols.push({ type: 'dropdown', title: 'Code', width: 40, align: 'center', source: CODES, autocomplete: false });
    cols.push({ type: 'text', title: 'Comment', width: 80, align: 'left' });
  }
  return cols;
}

function headers() {
  return [
    [{ title: '', colspan: LABEL_COLUMNS }, ...GROUPS.map((g) => ({ title: g.title, colspan: 3 * g.levels }))],
    [{ title: '', colspan: LABEL_COLUMNS }, ...LEVELS.map((l) => ({ title: `${l.programme} (${l.isced})`, colspan: 3 }))],
  ];
}

function emptyData() {
  return ROWS.map((r, i) => [i % 3 === 0 ? r.sectorLabel : '', r.sexLabel, ...LEVELS.flatMap(() => ['', '', ''])]);
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

// onChange() runs after each change; onRefuse(messages) gets the entries refused by rules 1 to 3.
export function createGrid(host, { onChange, onRefuse } = {}) {
  let quiet = false;
  let before = null;
  let changed = [];
  let refused = [];

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
      const s = clean(pos.kind, value);
      const why = refusal(pos.kind, s);
      if (!why) return s;
      // Rules 1 to 3: a wrong entry is refused and the cell keeps what it had.
      refused.push(`${pos.cell.level.isced}, ${pos.cell.row.sectorLabel}, ${pos.cell.row.sexLabel}, ${pos.kind}: ${why}`);
      const old = ws.getValueFromCoords(x, y);
      return old === null || old === undefined ? '' : String(old);
    },
    onchange: (ws, td, x, y) => {
      const pos = byPosition.get(`${x}:${y}`);
      if (!quiet && pos) changed.push(pos.cell.id);
    },
    // Once per change, and once for a whole pasted block: fill in the totals, then run the checks.
    onafterchanges: () => {
      if (quiet) return;
      if (refused.length && onRefuse) onRefuse(refused);
      refused = [];
      if (!changed.length) return;
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
    if (pos && pos.kind === 'code') ws.openEditor(td, false, ev);
  });

  function get(id) {
    const c = BY_ID.get(id);
    const s = (v) => (v === null || v === undefined ? '' : String(v));
    return {
      value: s(ws.getValueFromCoords(c.x, c.y)),
      code: s(ws.getValueFromCoords(c.x + 1, c.y)).toUpperCase(),
      comment: s(ws.getValueFromCoords(c.x + 2, c.y)).trim(),
    };
  }

  // Writes values into the grid without starting the totals (used by the import and by the totals themselves).
  function setValues(values) {
    quiet = true;
    try {
      for (const [id, v] of values) {
        const c = BY_ID.get(id);
        ws.setValueFromCoords(c.x, c.y, v.value ?? '', true);
        if ('code' in v) ws.setValueFromCoords(c.x + 1, c.y, v.code ?? '', true);
        if ('comment' in v) ws.setValueFromCoords(c.x + 2, c.y, v.comment ?? '', true);
      }
    } finally {
      quiet = false;
    }
  }

  function refreshChecks() {
    const msgs = check(get, TOTALS);
    for (const c of CELLS) {
      for (const [dx, kind] of KINDS.entries()) {
        const td = ws.getCellFromCoords(c.x + dx, c.y);
        const m = msgs.get(`${c.id}:${kind}`);
        td.classList.toggle('a2-check', Boolean(m));
        if (m) td.title = m.join('\n'); else td.removeAttribute('title');
      }
    }
    return msgs;
  }

  // Fills in every empty total from its parts and keeps the totals that have a number (used after an import).
  function fillTotals() {
    const ids = CELLS.map((c) => c.id);
    setValues(new Map(fill(get, TOTALS, ids, TOTALS.map(() => null)).map(([id, value]) => [id, { ...get(id), value }])));
  }

  function values() {
    return new Map(CELLS.map((c) => [c.id, get(c.id)]));
  }

  function clear() {
    setValues(new Map(CELLS.map((c) => [c.id, { value: '', code: '', comment: '' }])));
    refreshChecks();
  }

  refreshChecks();
  return { ws, get, setValues, fillTotals, values, refreshChecks, clear };
}
