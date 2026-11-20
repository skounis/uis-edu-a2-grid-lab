// The entry rules of the A2 sheet that refuse a wrong entry (rules 1 to 3 of a2-validation-rules.md in the
// uis-d-platform GitHub repository). In Excel they are data validations with a pop-up; on the D-Platform rules 1 and 2
// come from the value type and the code list. The grid and the import refuse the same entries.
import { CODES } from './a2-layout.js';

// Cleans what was typed, pasted or read from a file: spaces (also non-breaking) and thousands commas go from a value,
// a code is put in capitals, a comment is trimmed.
export function clean(kind, v) {
  const s = v === null || v === undefined ? '' : String(v).trim();
  if (kind === 'code') return s.toUpperCase();
  if (kind === 'value') return s.replace(/[\s,\u00a0]/g, '');
  return s;
}

// Returns the reason an entry is refused, or '' when it is accepted. The entry must be cleaned first.
export function refusal(kind, s) {
  if (s === '') return '';
  if (kind === 'value') {
    return Number.isNaN(Number(s)) || Number(s) < 0 ? `"${s}" is not a number of 0 or more.` : '';
  }
  if (kind === 'code') {
    return CODES.includes(s) ? '' : `"${s}" is not one of the codes ${CODES.join(', ')}.`;
  }
  return s.length < 2 || s.length > 500 ? 'A comment must be 2 to 500 characters long.' : '';
}
