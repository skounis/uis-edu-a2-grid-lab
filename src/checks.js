// The checks of the A2 sheet that mark a cell yellow (rules 4 to 9 of a2-validation-rules.md in the uis-d-platform
// GitHub repository), with the messages of the EDU A form. Returns Map(cell id + ':value', ':code' or ':comment' ->
// [messages]). Rules 1 to 3 refuse an entry instead (entry-rules.js). Rule 10 compares A2 with A3, which is not in
// this lab.
import { CELLS } from './a2-layout.js';
import { expected, part } from './totals.js';

const isNum = (s) => s !== '' && !Number.isNaN(Number(s));

const CODE_MSG = {
  Z: 'Z means not applicable, so this cell should be 0 or empty.',
  M: 'M means the data are missing, so this cell should be empty.',
  X: 'X means these data are counted in another cell, so this cell should be empty.',
  W: 'W means this number includes other data, so enter a number above 0.',
};
const COMMENT_MSG = {
  X: 'Code X needs a comment that says where these data are counted. Add it in the Comment column.',
  W: 'Code W needs a comment that says what other data this number includes. Add it in the Comment column.',
};

function expectedCode(get, t) {
  const codes = t.parts.map((p) => get(p).code);
  if (codes.includes('M')) return 'M';
  const first = codes[0];
  if (!codes.every((c) => c === first) || !['X', 'W', 'Z'].includes(first)) return '';
  if (first === 'X' && isNum(get(t.total).value)) return '';
  return first;
}
function emptyReason(get, t) {
  const kinds = t.parts.map((p) => part(get, p).k);
  if (kinds.includes('M')) return 'a part is coded M (missing)';
  if (kinds.includes('E')) return 'a part is empty';
  return 'all its parts are coded X (counted in another cell)';
}
function codeReason(get, t, ec) {
  if (ec === 'M') return 'A part is coded M (missing), so this total should also be coded M.';
  if (ec !== '') return `All parts are coded ${ec}, so this total should also be coded ${ec}.`;
  if (t.parts.every((p) => get(p).code === 'X')) return 'This total has a number, so it should have no code.';
  return 'The parts do not all have the same code, so this total should have no code.';
}

export function check(get, totals) {
  const msgs = new Map();
  const add = (key, m) => { if (!msgs.has(key)) msgs.set(key, []); msgs.get(key).push(m); };
  for (const c of CELLS) {
    const { value: v, code: k, comment = '' } = get(c.id);
    let bad = false;
    if (k === 'Z') bad = v !== '' && !(isNum(v) && Number(v) === 0);
    else if (k === 'M' || k === 'X') bad = v !== '';
    else if (k === 'W') bad = !(isNum(v) && Number(v) > 0);
    if (bad) { add(`${c.id}:value`, CODE_MSG[k]); add(`${c.id}:code`, CODE_MSG[k]); }
    // Rule 5: a comment goes with X and W.
    if ((k === 'X' || k === 'W') && comment === '') { add(`${c.id}:code`, COMMENT_MSG[k]); add(`${c.id}:comment`, COMMENT_MSG[k]); }
  }
  for (const t of totals) {
    const cur = get(t.total).value;
    const exp = expected(get, t);
    if (exp !== null && (!isNum(cur) || Math.round(Number(cur)) !== Math.round(exp))) {
      add(`${t.total}:value`, isNum(cur) ? `This total does not match its parts. The parts add up to ${exp}.`
        : `This total is empty. The parts add up to ${exp}.`);
    } else if (exp === null && cur !== '' && get(t.total).code !== 'Z') {
      add(`${t.total}:value`, `This total should be empty, because ${emptyReason(get, t)}.`);
    }
    const ec = expectedCode(get, t);
    if (ec !== get(t.total).code) add(`${t.total}:code`, codeReason(get, t, ec));
  }
  return msgs;
}
