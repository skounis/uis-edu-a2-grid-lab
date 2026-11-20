import './styles.css';
import { createGrid } from './grid.js';

const grid = createGrid(document.getElementById('a2-grid'), { onChange: showStatus });
const status = document.getElementById('status');
const report = document.getElementById('report');

function showStatus() {
  const n = [...grid.values().values()].filter((v) => v.value !== '' || v.code !== '').length;
  const marked = document.querySelectorAll('#a2-grid td.a2-check').length;
  status.textContent = `${n} of 144 cells filled. ${marked} cells fail a check.`;
}

document.getElementById('file').addEventListener('change', async (ev) => {
  const file = ev.target.files[0];
  if (!file) return;
  report.textContent = `Reading ${file.name}...`;
  try {
    // ExcelJS is large, so it is loaded only when a file is imported.
    const { importA2 } = await import('./import-xlsx.js');
    const result = await importA2(await file.arrayBuffer());
    if (!result.sheet) {
      report.textContent = result.problems.join('\n');
      return;
    }
    grid.setValues(result.values);
    grid.refreshChecks();
    const lines = [`Imported sheet "${result.sheet}" of ${file.name}.`];
    if (result.problems.length) lines.push('', 'Not imported:', ...result.problems);
    report.textContent = lines.join('\n');
  } catch (e) {
    report.textContent = `The file could not be read: ${e.message}`;
  }
  ev.target.value = '';
  showStatus();
});

document.getElementById('clear').addEventListener('click', () => {
  grid.clear();
  report.textContent = '';
  showStatus();
});

showStatus();
