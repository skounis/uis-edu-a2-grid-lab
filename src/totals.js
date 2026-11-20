// The totals of A2, with the rules of the A2 sheet as used in the EDU A form of the D-Platform
// (uis-d-platform docs/architecture/forms/README.md, Totals). get(id) returns { value, code } of a cell as strings.

const isNum = (s) => s !== '' && !Number.isNaN(Number(s));

// A part counts as a number when it has a value and no code, a value with W, or 0 with Z. X is left out of the sum.
// M or an empty part leaves the total empty.
export function part(get, id) {
  const { value, code } = get(id);
  if (code === 'M') return { k: 'M' };
  if (code === 'X') return { k: 'X' };
  if (!isNum(value)) return { k: 'E' };
  if (code === 'Z' && Number(value) !== 0) return { k: 'E' };
  return { k: 'N', n: Number(value) };
}

export function expected(get, total) {
  let sum = null;
  for (const id of total.parts) {
    const q = part(get, id);
    if (q.k === 'M' || q.k === 'E') return null;
    if (q.k === 'N') sum = (sum === null ? 0 : sum) + q.n;
  }
  return sum;
}

// After a change: fill in the totals that depend on the changed cells. A total is filled in when it is empty or
// still holds the sum it had before the change; a total the country typed is kept. Returns [id, value] pairs.
export function fill(get, totals, changedIds, before) {
  const touched = new Set(changedIds);
  const values = new Map();
  const read = (id) => (values.has(id) ? { ...get(id), value: values.get(id) } : get(id));
  totals.forEach((t, i) => {
    if (!touched.has(t.total) && !t.parts.some((p) => touched.has(p))) return;
    touched.add(t.total);
    const cur = read(t.total).value;
    const now = expected(read, t);
    const auto = cur === '' || (isNum(cur) && before[i] !== null && Number(cur) === before[i]);
    if (!auto) return;
    if (cur === '' && now === null) return;
    if (isNum(cur) && now !== null && Number(cur) === now) return;
    values.set(t.total, now === null ? '' : String(now));
  });
  return [...values.entries()];
}

export const snapshot = (get, totals) => totals.map((t) => expected(get, t));
