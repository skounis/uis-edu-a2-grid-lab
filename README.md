# A2 grid lab

A small JavaScript project to try Jspreadsheet CE with the A2 table of the UIS questionnaire, outside the D-Platform.
It builds a grid with the layout of sheet A2 of the Excel questionnaire, fills in the totals, runs the checks,
and imports A2 from an Excel file (.xlsx). Nothing here is saved to the D-Platform.

## Setup

You need Node.js 22 (or 20) and npm.

```
npm install
npm run dev
```

Then open the address Vite prints (usually http://localhost:5173).

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Starts the dev server with live reload. |
| `npm test` | Runs the tests (Vitest). |
| `npm run build` | Builds the site into `dist/`. |
| `npm run preview` | Serves the built `dist/` to check it. |
| `npm run sample` | Writes `test/data/sample-a2.xlsx`, a small A2 file for the import tests. |

## Deploy

`.github/workflows/deploy.yml` runs the tests, builds the site and publishes it to GitHub Pages on each push to `main`.
In the GitHub repository settings, set Pages > Source to "GitHub Actions" once.
The build uses relative paths (`base: './'`), so `dist/` also works from any static web server or folder.

## Structure

| File | What it holds |
| --- | --- |
| `index.html` | The page: toolbar, grid and import report. |
| `src/a2-layout.js` | The A2 layout: 16 levels, 9 rows, the grid columns, the Excel address of each cell and the 108 totals. |
| `src/totals.js` | Fills in the totals from their parts, with the rules for the codes Z, M, X and W. |
| `src/checks.js` | The checks that depend on the codes (rules 4 and 6 to 9 of the A2 validation rules). |
| `src/grid.js` | Sets up Jspreadsheet CE: columns, headers, colours, events and the one-click code list. |
| `src/import-xlsx.js` | Reads sheet A2 of an .xlsx file with ExcelJS. |
| `src/main.js` | Connects the page, the grid and the import. |
| `test/` | Tests for the layout, the totals and the import. |
| `scripts/make-sample-xlsx.js` | Writes the sample file used by the tests. |

## How the import works

The importer looks for the sheet named `A2` (or a sheet whose name starts with A2) and reads rows 14 to 22.
The first value column is V (column 22). Each level takes three columns: value, code and a spare column, so the
next level starts at Y, then AB, and so on. The code of a cell is in the column right after its value.
These addresses come from the A2 data model (`docs/architecture/data-model/a2.md` in the uis-d-platform GitHub repository).

Values keep what the file holds; spaces and commas are removed. A formula cell gives its saved result.
Codes are turned to capitals. A value that is not a number, or a code other than Z, M, X or W, is left out and listed
under "Not imported". The totals in the file are imported as they are, and the checks then mark any total that does
not match its parts.

ExcelJS is large, so it loads only when a file is imported.

## Libraries and licences

| Library | Version | Licence |
| --- | --- | --- |
| Jspreadsheet CE | 5.0.4 | MIT |
| jSuites | 5.13.5 | MIT |
| ExcelJS | 4.4.0 | MIT |
| Vite, Vitest | 7.1.12, 3.2.4 | MIT (build and test only) |

Vite warns that the Jspreadsheet CE bundle uses `eval`. This comes from the library and does not affect the build.
