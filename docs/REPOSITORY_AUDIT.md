# Repository Audit — react_beginner

- **Audited:** `master` @ `aa73be515d54d86f3c8e04d5f4554f139bbd9cbc` (72 commits, clean)
- **Date:** 2026-11-13
- **Method:** read-only inspection of the clone, plus a disposable copy under the OS temp directory for `npm install` / `npm run build`, plus disposable `node:22-alpine` containers. No file inside the clone was modified by the audit.
- **Companion docs:** `ARCHITECTURE.md`, `TECHNICAL_DEBT.md`, `IMPROVEMENT_ROADMAP.md`.

## 1. Scope and inventory

| Item | Value |
|---|---|
| Tracked files | 26 |
| Source files | 8 (`.js`/`.jsx`), 332 lines total |
| CSS | 1 file, 197 lines |
| Direct dependencies | 8 (all in `dependencies`) |
| Lockfile entries | 1,284 (`lockfileVersion` 2) |
| Tests | 0 |
| Docker / CI / Makefile | none |
| Environment files | none |
| Secrets found | 0 |

## 2. Verification evidence

All commands were run on 2026-11-13. "Exit" is the process exit code; `npm audit` and `npm test` exit non-zero because of the findings, which is the expected result.

| # | Command | Exit | Result |
|---|---|---|---|
| 1 | `git -C projects/repos/react_beginner rev-parse HEAD` | 0 | `aa73be515d54d86f3c8e04d5f4554f139bbd9cbc` |
| 2 | `git -C projects/repos/react_beginner rev-list --count HEAD` | 0 | 72 |
| 3 | `git -C projects/repos/react_beginner status --porcelain` | 0 | empty (clean) |
| 4 | `git -C projects/repos/react_beginner ls-files` | 0 | 26 files |
| 5 | `docker run --rm -v "<temp copy>:/app" -w /app node:22-alpine npm install --no-audit --no-fund` | 0 | 1,283 packages added |
| 6 | `docker run ... npm run build` | 0 | "Compiled with warnings"; `main.*.js` 6.24 kB gzip, `main.*.css` 980 B gzip |
| 7 | `docker run ... npm ls react` / `react-dom` | 0 | 19.3.0 / 19.3.0 |
| 8 | `node -e "typeof require('react-dom').render"` | 0 | `undefined` (`hydrate` `undefined`, `createRoot` `function`) |
| 9 | static serve of `build/` + headless Chrome | 0 | page blank; console `TypeError: t.render is not a function` |
| 10 | `CI=true npm test -- --watchAll=false` | **1** | "No tests found"; 7 files checked, 0 matches |
| 11 | `npm audit --json` | **1** | 80 advisories: 4 critical / 35 high / 20 moderate / 21 low |
| 12 | `npm audit` summary script | 0 | 58 fixable in range; 22 require `react-scripts` replacement |
| 13 | `npm ls prop-types --depth=0` | 0 | empty (not a declared dependency) |
| 14 | `npm ls web-vitals --depth=0` | 0 | `web-vitals@3.5.2` declared, never imported |
| 15 | `grep -r "web-vitals\|@testing-library\|reportWebVitals" src/` | 1 | 0 matches |
| 16 | `gitleaks dir projects/repos/react_beginner --redact` | 0 | no leaks found |
| 17 | `gitleaks git projects/repos/react_beginner --redact` | 0 | 43 commits scanned, no leaks found |
| 18 | `gh repo view RasimAghayev/react_beginner --json ...` | 0 | default `master`; no description; no license; wiki + discussions enabled; not archived/fork |
| 19 | `gh pr list --state open` | 0 | 5 bot PRs (#47–#51) |
| 20 | file probes (`Dockerfile`, `docker-compose.yml`, `.dockerignore`, `Makefile`, `.github`, `.env*`, `.nvmrc`, `tsconfig.json`) | 0 | all absent |

## 3. Findings — P0 to P3

Severity: **P0** security / data loss / broken build or runtime · **P1** correctness / major debt · **P2** quality · **P3** nice-to-have.

### P0

| ID | Finding | Evidence |
|---|---|---|
| A-01 | **The application does not run.** `src/index.js:6` calls `ReactDOM.render`, removed in React 19. `react-dom@19.3.0` has no `render` export, so the bundle throws on load and `#root` stays empty. The production build compiles, which makes this easy to miss. | `src/index.js:2,6`; `typeof render === "undefined"`; Chrome console `TypeError: t.render is not a function` |
| A-02 | **4 critical dependency advisories**, 80 in total, `npm audit` exit 1. They are in the CRA build/dev-server chain (`webpack-dev-server`, `express`, `form-data`, `proxy-addr`, `shell-quote`, `websocket-driver`, …) and are not shipped in the static bundle, but no clean audit gate is possible. | `npm audit --json` in `node:22-alpine`, exit 1 |

### P1

| ID | Finding | Evidence |
|---|---|---|
| A-03 | **React 19 ignores `defaultProps` on function components.** `Header` loses `text`/`bgColor`/`textColor`; `Card` loses `reverse`. After A-01 is fixed, the header would render empty and colourless. | `Header.jsx:17-21`, `Card.jsx:8-10` |
| A-04 | **`prop-types` is a phantom dependency.** Imported in 4 files, absent from `package.json`; it resolves only through transitive hoisting. React 19 also ignores `propTypes` on function components, so the checks are decorative. | `package.json:5-14`; `npm ls prop-types --depth=0` → empty |
| A-05 | **Unmaintained toolchain.** `react-scripts 5.0.1` is the final CRA release (2022-04-12); CRA is no longer developed. It pins ~1,200 transitive packages and blocks 22 advisories. | registry metadata; `package.json:12` |
| A-06 | **No tests at all.** `npm test` exits 1 with "No tests found"; three Testing Library packages are installed but unused. There is no regression net for the React 19 migration. | container run; grep |
| A-07 | **No reproducible environment.** No Dockerfile, compose, Makefile or `.env.example`. | file probes |
| A-08 | **No CI/CD.** No workflow, no Dependabot config. | file probes |

### P2

| ID | Finding | Evidence |
|---|---|---|
| A-09 | **Unused dependencies:** `@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event`, `web-vitals`, all in `dependencies`. | `package.json:6-8,13`; grep |
| A-10 | **Dead CSS.** Most of the 197-line stylesheet is unused by the rendered tree. | `index.css` vs component tree |
| A-11 | **Non-functional / inaccessible UI.** Delete button only logs; `setFeedback` unused; icon-only button has no accessible name. | `FeedbackItem.jsx:6-12`, `App.js:8` |
| A-12 | **Tracked IDE/scratch files.** `.idea/` (6 files), `.vscode/settings.json`, `cmd`. `.gitignore` misses `.idea/` and `.vscode/`. | `git ls-files`; `.gitignore:1-23` |
| A-13 | **Boilerplate docs/metadata.** Default CRA README; manifest says "React App"/"Create React App Sample"; no `LICENSE`; empty GitHub description. | `README.md:1`; `public/manifest.json:2-3`; `gh repo view` |
| A-14 | **No error boundary.** A single render error blanks the page. | `src/index.js`, `App.js` |
| A-15 | **No data layer.** Hardcoded seed data only; cannot be pointed at a backend. | `src/data/FeedbackData.js` |

### P3

| ID | Finding | Evidence |
|---|---|---|
| A-16 | JavaScript instead of TypeScript. | file probe |
| A-17 | Inconsistent formatting (quotes, semicolons, indentation). | source |
| A-18 | Default branch `master` (Gate 4). | `gh repo view` |
| A-19 | Remote Google Fonts `@import` (render-blocking, third-party). | `index.css:6` |
| A-20 | `web-vitals` 3 → 6 major gap, moot while unused. | Phase 2 inventory |

## 4. Security and secrets

| Check | Result |
|---|---|
| `gitleaks dir` (working tree) | **0 findings** |
| `gitleaks git` (full history, 43 commits) | **0 findings** |
| `.env*` / `.npmrc` / key files | none present |
| Hardcoded credentials in `src/` or `public/` | none |
| Dangerous sinks (`dangerouslySetInnerHTML`, `eval`) | none |
| Network calls from app code | none |
| Dependency licences (direct) | MIT (react, react-dom, react-icons, react-scripts, testing-library ×3), Apache-2.0 (web-vitals) |
| Repo licence | **none declared** |

The only external requests are the Google Fonts CSS import and the `hits.sh` badge image in the README; neither transmits user data or credentials.

## 5. Dependency risk

- `npm audit`: 4 critical / 35 high / 20 moderate / 21 low.
- 58 advisories are fixable by regenerating the lockfile within existing semver ranges.
- 22 require replacing `react-scripts`; all 4 criticals are in this group.
- Because the production artifact is static, the shipped JS does not include `webpack-dev-server`; the practical risk is to the developer machine and CI build stage, not to end users. This should be re-measured after the Vite migration.

## 6. Legal / licensing

No source licence header, no `LICENSE` file, no `NOTICE`. Dependencies are permissive (MIT/Apache-2.0), so a licence can be chosen freely (CLAUDE.md default: MIT or Apache-2.0). The UI design and CSS are credited to `bradtraversy/feedback-app` (`index.css:1-3`); attribution should be kept in the README when the boilerplate is replaced.

## 7. What is verified vs unconfirmed

**Verified:** repository state, dependency graph, audit counts, missing tooling, the React 19 crash (build + real browser), zero tests, zero secrets, zero test imports.

**Unconfirmed:** per-advisory reachability from the shipped bundle; exact Vite migration effort; behaviour of the app after the `createRoot` fix (it has never been run successfully); accessibility conformance (no audit tool was run).