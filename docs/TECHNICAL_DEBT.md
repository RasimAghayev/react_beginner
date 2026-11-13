# Technical Debt — react_beginner

Snapshot of `master` @ `aa73be5`, 2026-11-13. Each item records what the debt is, why it hurts, where it came from, and which phase is planned to remove it. No item here has been fixed by the audit.

## Debt register

| ID | Debt | Impact | Origin | Fix phase |
|---|---|---|---|---|
| TD-01 | **Bootstrap uses the removed React 19 API.** `src/index.js:6` calls `ReactDOM.render`; `react-dom@19.3.0` exports only `createRoot`. | P0 — the app renders a blank page; every feature is unreachable. | React was bumped 18 → 19 by Renovate (#44, #46) without a code migration. | Phase 6 |
| TD-02 | **Function-component `defaultProps`.** `Header.jsx:17-21`, `Card.jsx:8-10`. | P1 — React 19 ignores them; header text/colors and card inversion silently become `undefined`. | CRA tutorial code written for React ≤18. | Phase 6 |
| TD-03 | **`prop-types` is undeclared.** Imported in `Header.jsx:1`, `FeedbackList.jsx:1`, `FeedbackItem.jsx:2`, `Card.jsx:1`; absent from `package.json`. | P1 — build depends on hoisting from `eslint-plugin-react`; a lockfile regeneration can break it. The checks are also ignored by React 19. | Tutorial imports; never added to the manifest. | Phase 6/7 |
| TD-04 | **Unmaintained build toolchain.** `react-scripts 5.0.1` (final CRA release, 2022-04-12), ~1,200 pinned transitive packages. | P1 — no security fixes upstream; 22 advisories cannot be resolved; blocks modern Node tooling. | Project scaffolded with CRA in 2022; only patch-level bot bumps since. | Phase 6 |
| TD-05 | **80 known advisories** (4 critical). | P0/P1 — audit gate is red; build-time exposure on every developer machine and CI runner. | Stale lockfile plus CRA-pinned transitives. | Phase 6 (lockfile + CRA removal) |
| TD-06 | **No tests.** `CI=true npm test` → exit 1, 0 test files. | P1 — no regression net; every later phase is unverifiable. | CRA template; `reportWebVitals` sample test never added. | Phase 5 (characterization), Phase 11 |
| TD-07 | **Testing libraries installed but unused**, all in `dependencies`. | P2 — larger production install, misleading manifest. | CRA template defaults. | Phase 7 |
| TD-08 | **`web-vitals` unused**, declared `^3.0.0` (latest 6.2.3). | P2 — dead dependency with a major-version gap. | CRA template. | Phase 7 |
| TD-09 | **Dead CSS.** Most of `src/index.css` (197 lines) styles components that do not exist (rating radios, input group, buttons, about page, edit). | P2 — maintenance noise, larger bundle, misleading styling reference. | Tutorial stylesheet copied wholesale. | Phase 7 |
| TD-10 | **Hardcoded data only.** `src/data/FeedbackData.js` seeds 3 objects; no adapter or API layer. | P2 — limits reuse; no persistence by design. | Tutorial scope. | Phase 8 (documented, not "fixed") |
| TD-11 | **Non-functional interactions.** `FeedbackItem.handleClick` only `console.log`s; `App.setFeedback` unused; icon-only close button has no accessible name. | P2 — UI promises an action it does not perform; accessibility gap. | Incomplete tutorial implementation. | Phase 8/9/11 |
| TD-12 | **No error boundary / error reporting.** | P2 — one render error blanks the page with no diagnostic. | CRA default. | Phase 9 |
| TD-13 | **No container baseline.** No `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `Makefile`, `.env.example`. | P1 — no reproducible build or test command; host-dependent verification. | Never created. | Phase 5 |
| TD-14 | **No CI/CD.** No `.github/workflows`, no Dependabot config. | P1 — regressions and red builds are invisible; dependency drift is manual. | Never created. | Phase 4 (config), Phase 10 |
| TD-15 | **Tracked IDE/scratch files.** `.idea/` (6 files), `.vscode/settings.json`, `cmd`; `.gitignore` misses `.idea/`/`.vscode/`. | P2 — repo noise, editor-specific commits. | `ide_add` commit (2022-02-20). | Phase 4/7 |
| TD-16 | **Boilerplate README and manifest.** README is default CRA text; `manifest.json` still says "React App"/"Create React App Sample"; no `LICENSE`; empty GitHub description. | P2 — no onboarding or legal clarity. | CRA template. | Phase 15 |
| TD-17 | **JavaScript, no TypeScript.** | P3 — no compile-time contracts; prop validation is the ignored `propTypes`. | CRA JS template. | Phase 7 (optional; needs a decision) |
| TD-18 | **Inconsistent formatting.** Mixed quotes/semicolons/indentation; no Prettier config. | P3 — noisy diffs. | Hand-written tutorial code. | Phase 9 |
| TD-19 | **Default branch `master`.** | P3 — naming inconsistency; Gate 4 approval required. | Repo created 2022. | Phase 4 (Gate 4) |
| TD-20 | **Remote font `@import`.** `src/index.css:6`. | P3 — render-blocking third-party request; no offline fallback. | Tutorial styling. | Phase 8/9 |

## Notes

- **TD-01 is the only item that makes the product unusable.** Everything else is quality or risk reduction.
- **TD-04 and TD-05 are linked:** the only way to clear the 22 CRA-blocked advisories is to replace `react-scripts` (Phase 6). Lockfile regeneration alone clears 58.
- **TD-02/TD-03 are code-level migrations** that must accompany the React 19 path, otherwise fixing TD-01 alone produces a blank header and a non-inverting card.
- **TD-13/TD-14 are prerequisites for evidence.** Phases 6–11 require `make verify`; without them, "verified" cannot be claimed.
- Nothing in this register requires a public-contract change. If the Vite migration or TypeScript adoption changes the build contract, Approval Gate 5 must be evaluated before execution.