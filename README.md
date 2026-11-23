# uis-edu-a2-grid-lab

A small JavaScript project to try Jspreadsheet CE with table A2 of UIS questionnaire A (2026 Survey of Formal
Education, UIS_ED_A_2026_EN.xlsx), outside the D-Platform.
It builds a grid with the layout of sheet A2 of the Excel questionnaire (value, code and comment for each level),
fills in the totals, applies the rules of the sheet and imports A2 from an Excel file (.xlsx). Nothing here is saved to the D-Platform.

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

## Input files

The lab has no layout of its own in the code. Two input files in `config/` drive it. Both are made by a person
(by hand or with AI), not by a script. Everything after them is done by the code, the same way each time.

| File | Who makes it | How |
| --- | --- | --- |
| `config/a2-step1-input.json` | Made once with AI in the uis-d-platform GitHub repository, checked by hand. Copied here by hand. | AI read the A2 sheet of the Excel questionnaire and the lists typed into the old form build script, and wrote them as JSON. The result was checked against the Excel. |
| `config/a2-lab-input.json` | Made once with AI for the lab. Edited by hand when the grid should look different. | AI moved the column titles, widths, codes and fills that were typed into the lab code (`src/grid.js`, `src/a2-layout.js`) into this file, with no change to the values. |
| Cells, Excel addresses, totals | The code (`src/a2-layout.js`), each time the page or a test loads. | Worked out from the two files above. Not saved to a file. |

`config/a2-step1-input.json` describes the A2 sheet: the 16 levels with their programme and ISCED labels, the groups
over them, the 3 types of institution, the 3 sexes, the first row (14), the first value column (V) and the 3 columns
of each level. It is the same file as `docs/architecture/forms/edu-a/a2-step1-input.json` in the uis-d-platform
GitHub repository, which also drives the build of the two D-Platform forms. Keep the copy here the same as the one
there: when that file changes, copy it here again and run `npm test`. The lab does not use its D-Platform parts
(data element and option codes, texts of the HTML form).

`config/a2-lab-input.json` holds what is only the lab's: the titles and widths of the columns, the codes Z, M, X
and W, and the fills of a total cell. It has the same format as `docs/architecture/forms/edu-a-grid/a2-grid-step1-input.json`
in the uis-d-platform GitHub repository, plus a comment column, which the D-Platform grid does not have.

Both files explain their fields in a `notes` block, because JSON has no comments.

## Structure

| File | What it holds |
| --- | --- |
| `index.html` | The page: toolbar, grid and import report. |
| `config/a2-step1-input.json` | The A2 sheet: levels, groups, rows, sexes and where the values start. A copy from the uis-d-platform GitHub repository. |
| `config/a2-lab-input.json` | What the grid shows and how: label columns, value, code and comment columns, the codes and the total fills. |
| `src/a2-layout.js` | The A2 layout built from the two input files: 16 levels, 9 rows, the grid columns, the Excel address of each cell and the 108 totals. |
| `src/totals.js` | Fills in the totals from their parts, with the rules for the codes Z, M, X and W. |
| `src/entry-rules.js` | Rules 1 to 3, which refuse an entry: a value must be a number of 0 or more, a code one of Z, M, X, W, a comment 2 to 500 characters. |
| `src/checks.js` | Rules 4 to 9, which mark a cell yellow with a message: value against code, a comment with X and W, totals against their parts, and the code of a total. |
| `src/grid.js` | Sets up Jspreadsheet CE: columns, headers, colours, events, the refusal of wrong entries and the one-click code list. |
| `src/import-xlsx.js` | Reads sheet A2 of an .xlsx file with ExcelJS. |
| `src/main.js` | Connects the page, the grid and the import. |
| `test/` | Tests for the layout, the totals and the import. |
| `scripts/make-sample-xlsx.js` | Writes the sample file used by the tests. |

## How the import works

The importer looks for the sheet named `A2` (or a sheet whose name starts with A2) and reads rows 14 to 22.
The first value column is V (column 22). Each level takes three columns: value, code and comment, so the
next level starts at Y, then AB, and so on. The code of a cell is in the column right after its value.
These addresses come from the A2 data model (`docs/architecture/data-model/a2.md` in the uis-d-platform GitHub repository).

Values keep what the file holds; spaces and commas are removed. A formula cell gives its saved result. The totals
of the UIS questionnaire are formulas, and a file may have no saved result for them; these are read as empty and
the grid fills in the empty totals from their parts. A total that has a number in the file is kept, as the country
may overwrite a total; the checks mark it when it does not match its parts. Comments are imported from the third
column. An entry that rules 1 to 3 refuse is left out and listed.

The questionnaire has data validations over whole columns. ExcelJS would expand them cell by cell, which takes
minutes, so the import skips them (`ignoreNodes: ['dataValidations']`).
Codes are turned to capitals. A value that is not a number, or a code other than Z, M, X or W, is left out and listed
under "Not imported". The totals in the file are imported as they are, and the checks then mark any total that does
not match its parts.

ExcelJS is large, so it loads only when a file is imported.

## Rules

The rules are those of the A2 sheet, as listed in `docs/architecture/forms/edu-a/a2-validation-rules.md` of the
uis-d-platform GitHub repository, and as in the EDU A form of the D-Platform.

| Rule | In the lab |
| --- | --- |
| 1 to 3 | A wrong entry is refused when it is typed, pasted or imported, and the report under the grid says why. |
| 4 to 9 | The cell turns yellow; the message shows on hover. |
| 6 to 8 (totals) | A total is filled in from its parts. A total the country types is kept and checked. |
| 10 | Not in the lab: it compares A2 with A3. |

## Libraries and licences

| Library | Version | Licence |
| --- | --- | --- |
| Jspreadsheet CE | 5.0.4 | MIT |
| jSuites | 5.13.5 | MIT |
| ExcelJS | 4.4.0 | MIT |
| Vite, Vitest | 7.1.12, 3.2.4 | MIT (build and test only) |

Vite warns that the Jspreadsheet CE bundle uses `eval`. This comes from the library and does not affect the build.
