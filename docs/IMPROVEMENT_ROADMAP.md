# Improvement Roadmap — react_beginner

Per-repository plan for Phases 4–11, prepared by the Phase 3 auditor on 2026-11-13. It is **not approved**: Approval Gate 10 is pending (see `projects/info/state/APPROVALS.md`). No phase below has been executed.

Baseline: `master` @ `aa73be5`, 72 commits, clean. Known red state: the app crashes at runtime (TD-01) and `npm audit` exits 1 (TD-05). Both are pre-existing and must be recorded as the baseline, not attributed to a later phase.

## 1. Phase applicability

| Phase | Applies? | Reason |
|---|---|---|
| 4 Git hygiene | **yes** | Branch cleanup, IDE/scratch files, Dependabot config, `master` → `main` (Gate 4). No history rewrite is expected: gitleaks found 0 secrets in 43 commits. |
| 5 Container baseline | **yes** | No Dockerfile/compose/Makefile exists. Needed before any upgrade can be verified. |
| 6 Upgrade to latest | **yes** | React 19 migration + CRA → Vite + dependency bumps; this is where the P0 fix lands. |
| 7 Dead code & restructure | **yes** | Unused deps, dead CSS, `cmd`, `console.log`, unused setter. |
| 8 Architecture | **yes, minimal** | The app has no domain and no external boundary; only KISS/YAGNI and a documented decision not to add router/state. |
| 9 Hardening | **yes** | Security, accessibility, error boundary, formatting/lint, bundle review. |
| 10 CI/CD | **yes** | No CI exists; a PR pipeline is required for every later claim of "green". |
| 11 Tests | **yes** | 0 tests today; component tests are the regression net. |
| 12 Merge small repos | **n/a** | Standalone tutorial demo with no duplicated code or shared domain; merging it into another repo would add no value and would need Gate 3. |
| 13 Shared library | **n/a** | No utility is duplicated in ≥3 repos; nothing here is a domain concept worth extracting. |
| 14 Rename | **n/a** | No other repo or CI references this repo. The convention name would be `react_beginner_BestPracticeArcht`, but a rename is Gate 2 and yields no functional benefit. |
| 15 Docs & manifest | **yes** | README is still CRA boilerplate; no LICENSE, no community files. |
| 16 Platform repo | **n/a** | A static SPA with no service, database, broker, or cluster target; a platform repo would be empty scaffolding. |
| 17 Final report | **n/a at this stage** | Runs after Phases 4–11 close across all repos. |

Database-specific work (schema, relations, indexes, transactions, N+1, migrations, backup/recovery) is **n/a**: there is no database layer. `MODE=standalone` stub adapters and `/health/live` / `/health/ready` are **n/a** for the same reason (no external dependency, static artifact). `openapi.yaml` / AsyncAPI is **n/a**: no API is exposed.

## 2. Phase 4 — Git hygiene

**Goal:** a clean branch model, no IDE artifacts, a dependency bot configuration, and a `main` default branch (with approval).

Steps:

1. Re-run `gitleaks git` over the full history (already 0 findings) and record it in the handoff. No Gate 1 work expected.
2. Remove tracked IDE/scratch files in their own commit: `.idea/`, `.vscode/settings.json`, `cmd`. Add `.idea/`, `.vscode/`, `*.iml` to `.gitignore`.
3. Add `.github/dependabot.yml` (npm weekly Monday 06:00 UTC, limits 10; GitHub Actions weekly, limit 5). Do **not** merge the 5 open bot PRs here — they are Phase 6 work.
4. Branch audit: keep `master` (then `main`) and `test` only; delete merged branches. **Gate 4** before renaming the default branch: create `main`, set it as default, keep `master` until refs are verified, then delete it.
5. Verify `.gitattributes` (line endings, `package-lock.json` as text) and a secret-scan pre-commit hook (gitleaks or a lightweight grep hook).

**Acceptance:** `git branch -a` shows only `main` (+ `test`); no `.idea`/`.vscode`/`cmd`; `gitleaks` clean; Dependabot config validates.

**Risk:** the rename breaks any external link/badge that hardcodes `master`; GitHub redirects, but branch protection and required checks must be re-pointed. Rollback: set the default branch back to `master` (Gate 4 covers this).

## 3. Phase 5 — Container baseline

**Goal:** one command (`make verify`) builds and serves the app in Docker; the current broken runtime is recorded as the baseline.

Steps:

1. Reserve a port block for this repo in `projects/info/state/ports.md` (the file has no `react_beginner` row yet). Proposed: `20230-20239` (next free after `20229`). **The auditor may not edit that file** — the Orchestrator must add it.
2. `Dockerfile` multi-stage:
   - `deps`: `node:22-alpine`, `npm ci` (BuildKit cache mount).
   - `build`: `npm run build` (or `vite build` after Phase 6).
   - `test`: `CI=true npm test` (characterization tests; currently red → documented baseline).
   - `runtime`: `nginx:alpine` (pinned), non-root, `HEALTHCHECK` on `/`, exec-form entrypoint, static `build/` only.
3. `.dockerignore`: `.git`, `.env*`, `node_modules`, `build`, `coverage`, `.idea`, `.vscode`, `docs`.
4. `docker-compose.yml`: one service, `COMPOSE_PROJECT_NAME=react_beginner-p5`, port from the reserved block, healthcheck.
5. `Makefile`: `build`, `test`, `verify` (= build + test), `up` (depends on `verify`), `down`, `lint`, `shell`, `clean`.
6. `.env.example`: the app has no runtime variables; document that explicitly (placeholders only, no secrets).
7. `docs/BASELINE.md`: record `npm audit` counts, build output sizes, the runtime crash, and the exact console error.

**Acceptance:** `make verify` runs in Docker; `make up` serves the static build; the red runtime state is documented (not hidden). Image size recorded.

**Risk:** `nginx:alpine` runs as root by default; the runtime stage must drop privileges and use an unprivileged port if the compose port mapping requires it. Rollback: the Dockerfile and Makefile are additive; delete them.

## 4. Phase 6 — Upgrade to latest

**Goal:** a running app on a maintained toolchain, with the dependency gates closed or explicitly excepted.

Upgrade order (from `projects/info/deps/react_beginner.md` §10):

1. **Code migration first (prerequisite for a meaningful test):**
   - `src/index.js`: `ReactDOM.render` → `createRoot(document.getElementById('root')).render(...)` from `react-dom/client`.
   - `Header.jsx`, `Card.jsx`: replace `defaultProps` with default parameters.
   - Resolve `prop-types`: either declare it and keep the checks, or remove the imports and rely on TypeScript/tests. React 19 ignores `propTypes`, so removal is the KISS choice.
2. **CRA → Vite 8.3.8** (Node `^20.19.0 || >=22.12.0`): replace `react-scripts` scripts with `vite` / `vite build` / `vite preview`; move `public/index.html` to the project root (or configure Vite's `root`), replace `%PUBLIC_URL%`; move `index.html` and `src/main.jsx`; keep `src/index.css`; replace the `eslintConfig` block with a real ESLint flat config; remove the `eject` script. Add `vite.config.js` with the dev-server port and build `outDir`.
3. **Runtime bumps:** `react` / `react-dom` 19.3.0 → 19.3.1; `@testing-library/user-event` 14.6.7 → 14.6.10; move testing libraries to `devDependencies` (they stay for Phase 11).
4. **Remove `web-vitals`** (unused) unless a Web Vitals report is wanted; if kept, bump to 6.x and document the API change.
5. **Lockfile:** regenerate (lockfileVersion 3), commit, re-run `npm audit`; record the residual count. Any advisory that remains must be listed with a written blocker in `docs/TECHNICAL_DEBT.md`.
6. **Bot PR triage:** merge renovate/dependabot PRs that match or are superseded; close the rest with a comment. (PR numbers #47–#51.)
7. **Verification:** `make verify` in Docker; browser smoke test (the app must render the header and 3 items); compare against `docs/BASELINE.md`.

**Targets:** read latest stable from the registry at run time (standing decision 1). Current known: react/react-dom 19.3.1, Vite 8.3.8, user-event 14.6.10, web-vitals 6.2.3 (only if kept).

**Risks:** CRA-specific behaviour is limited (`%PUBLIC_URL%`, `react-scripts` scripts, `eslintConfig`), so the migration is small; the main risk is the `index.html`/public path change and the dev-server port. Rollback: keep the CRA build on a branch until `make verify` is green; revert the Vite commit if needed.

**Gate 5:** no public API/contract is changed. If the migration changes the build artifact layout in a way consumers rely on (none exist), Gate 5 applies.

## 5. Phase 7 — Dead code & restructure

Steps:

1. Run tooling in a disposable container: `npx knip`, `npx depcheck`, `npx eslint .`.
2. Remove proven-dead items in separate commits (`refactor: remove …`):
   - unused deps: `@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event` (or move to `devDependencies`), `web-vitals`;
   - `src/index.css` rules not referenced by any component (verify with the built class list, not by eye);
   - `cmd`, `console.log` in `FeedbackItem.jsx`, unused `setFeedback`;
   - `prop-types` imports if TD-03 is resolved by removal.
3. Re-shape to Vite conventions (entry `src/main.jsx`, `index.html` at root).
4. Do not delete `FeedbackData.js` (it is the app's data source) or `robots.txt`/manifest icons (referenced by `index.html`).
5. Re-run `make verify` after each batch.

**Acceptance:** `knip`/`depcheck` clean or every remaining item justified; bundle size recorded; baseline behavior unchanged.

**Risk:** CSS is not statically analyzable; a class may be applied dynamically. Mitigation: search the built bundle for each class before deletion; if tooling and tests disagree, keep and document.

## 6. Phase 8 — Architecture

Apply only what earns its place; each applied pattern gets a "why here" in `ARCHITECTURE.md` and an ADR in `docs/adr/`.

| Principle | Decision for this repo |
|---|---|
| DRY | **Not applicable now** — no repeated logic across modules. Revisit if a second list/form component appears. |
| KISS / YAGNI | **Applies.** No router, no state library, no component library, no abstraction layer. Keep the component tree as is. |
| SOLID | **Not applicable** — no classes, no multi-reason-to-change modules, no test-blocking coupling. |
| Clean / Hexagonal | **Not applicable** — there is no external system to swap; adding ports/adapters would be speculative. |
| DDD | **Not applicable** — no domain invariants; the "model" is three display records. |
| EDA | **Not applicable** — no asynchronous reactions or inter-module events. |
| Modular monolith | **Not applicable** — single-purpose SPA. |
| GoF patterns | **Not applicable** — no named problem to solve. |

Concrete work:

- Document the "no router / no global store" decision (ADR 0001).
- Decide the data story: either keep hardcoded data (demo) or introduce a thin `api.js` adapter with a `MODE=standalone` fallback. Recommendation: keep static, document it as a demo limitation (KISS).
- Add an error boundary in Phase 9, not here.

**Acceptance:** every applied principle justified; every skipped principle has a one-line reason (this table satisfies that).

## 7. Phase 9 — Hardening

Security:

- Re-run `npm audit`; fix or document each residual advisory. No secrets exist (verified); keep it that way.
- No `dangerouslySetInnerHTML`, no network calls, no auth surface: OWASP Top 10 items that apply are dependency vulnerabilities (A06) and security misconfiguration (A05). Add a Content-Security-Policy via the static server config (nginx `add_header`) and disable directory listing.
- If the Google Fonts import stays, add `preconnect` or self-host; a CSP must allow it explicitly.

Performance:

- Bundle is already tiny (6.24 kB JS gzip, 980 B CSS gzip). Do not optimize speculatively. Re-measure after Vite; record in `docs/TEST_REPORT.md`.

Accessibility (WCAG 2.1 AA target):

- Icon-only close button needs `aria-label="Delete feedback"` (or visible text).
- Check colour contrast of `#ff6a95` on `#fff` and on `rgba(0,0,0,0.4)`.
- Ensure the rating badge and text are readable by screen readers; add a landmark for the header.

Quality tooling:

- ESLint flat config (Vite), Prettier, `npm run lint`, `npm run format`.
- TypeScript is **not** adopted by default (KISS/YAGNI for a 300-line demo); record the decision in an ADR. If adopted, it is a separate change with its own verification.

Observability:

- No server, no metrics. Remove `console.log`; keep a single error boundary fallback. Sentry/analytics are **not** added (no product telemetry requirement).

Dual-mode / health / OpenAPI: **n/a** (no external dependency, static artifact, no API).

**Acceptance:** security checklist documented; CSP verified in the container; a11y fixes verified manually and with an axe run in Phase 11.

## 8. Phase 10 — CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`):

1. Triggers: `pull_request` (paths: `src/**`, `public/**`, `package*.json`, `Dockerfile`, `.github/**`), `push` to `main`; `concurrency` with `cancel-in-progress`; `timeout-minutes` on every job.
2. Jobs, cheapest first:
   - `quality`: `npm ci` (cached), ESLint, Prettier check, `npm audit --audit-level=high` (informational until the residual is documented).
   - `test`: Docker `test` stage (`make test`), coverage uploaded.
   - `build`: Docker build, `npm run build`, bundle-size note.
   - `image`: build the runtime image once, scan it (Trivy or Docker Scout), fail on critical.
3. Actions pinned by commit SHA; `permissions: contents: read`; no secrets for fork PRs.
4. Publish only on tags, from `main` (static artifact; GitHub Pages or release asset).
5. Dependabot config from Phase 4.

**Budget:** ≤10 min wall-clock. Record the actual duration in `docs/TEST_REPORT.md`.

**Acceptance:** a real run on the PR is green and within budget; the slowest job is documented.

## 9. Phase 11 — Tests

Tooling: Vitest + `@testing-library/react` + `@testing-library/jest-dom` + jsdom (replace the CRA/Jest stack during Phase 6). Tests run in the Docker `test` stage and in CI.

Test cases (ID format `TC_<MODULE>_<SCENARIO>_<NUMBER>`):

| ID | Scenario | Expected |
|---|---|---|
| TC_APP_RENDER_001 | App renders with seed data | 3 feedback items with their ratings and texts |
| TC_APP_EMPTY_001 | `feedback` is an empty array | "No Feedback yet" is shown |
| TC_HEADER_DEFAULTS_001 | Header rendered without props | default text and colours are applied |
| TC_CARD_REVERSE_001 | `Card reverse` | `.card.reverse` class present |
| TC_CARD_DEFAULT_001 | `Card` without `reverse` | no `reverse` class |
| TC_ITEM_DELETE_001 | Delete button clicked | handler called with the item id (current behavior: log; Phase 8 may implement removal) |
| TC_A11Y_BUTTON_001 | Close button accessible name | non-empty accessible name |
| TC_A11Y_CONTRAST_001 | axe scan of the page | no serious/critical violations |

**Acceptance:** suite green in Docker and CI; coverage reported honestly; `docs/TESTING_STRATEGY.md` and `docs/TEST_REPORT.md` written; baseline regression checked.

**Rule:** if a production bug is found, do not fix it here — hand it back to the Orchestrator (R8).

## 10. Sequencing and dependencies

```
Phase 4 (hygiene) ──► Phase 5 (Docker baseline) ──► Phase 6 (React 19 + Vite)
                                   │                         │
                                   └──► Phase 7 (dead code) ◄─┘
/dL                                                    │
/dL9 (hardening) ◄─────────────────────────────────────┘
/dL10 (CI) ◄── Phase 9
/dL11 (tests) ◄── Phase 9 (Vitest migration is part of Phase 6)
Phase 15 (docs) after 4–11
```

- Phase 5 must exist before Phase 6 so the upgrade can be verified.
- Phase 6 must fix TD-01 before any test can pass; Phase 11 writes the tests, Phase 5 may add characterization tests only.
- Phase 10 depends on Phase 9's lint/format tooling.

## 11. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| The app has never run successfully | "Baseline" is a crash, not a working app | Phase 6 step 1 fixes the bootstrap; record the crash in `BASELINE.md` as the pre-existing state |
| Vite migration changes the dev/build contract | Broken scripts, wrong public paths | Small CRA surface (no custom config); migrate on a branch; `make verify` before merge |
| React 19 `defaultProps` removal | Header/cards render empty | Fixed in the same Phase 6 step as the bootstrap |
| Lockfile regeneration changes hoisting | Phantom `prop-types` breaks | Resolve TD-03 before or with the regeneration |
| 22 CRA-blocked advisories | Audit gate stays red | Only the Vite migration clears them; document any residual with a blocker |
| No tests | Later phases cannot prove behavior | Phase 5 characterization + Phase 11 suite |
| `master` → `main` rename | External links/badges break | GitHub redirects; verify branch protection and required checks after the rename (Gate 4) |
| Static hosting assumed | Unknown deployment target | Document the static artifact and a generic nginx/Pages deployment; no cluster work |

## 12. Where each standing decision lands

| Decision | Where it lands here |
|---|---|
| 1 Latest versions, one logical change at a time | Phase 6, read from the registry at run time; each bump verified in Docker; blockers in `TECHNICAL_DEBT.md` |
| 2 Docker-first | Phase 5 (Dockerfile, compose, Makefile) and every verification afterwards |
| 3 No new library before dependency analysis | Phase 2 data exists (`deps/react_beginner.md`); any new dev tool (Vitest, knip, Prettier) gets an entry in `docs/DEPENDENCY_DECISIONS.md` |
| 4 Semantic Git | Every phase: `docs:`, `chore:`, `build:`, `refactor:`, `test:`, `ci:` commits; one PR per phase |
| 5 Branch hygiene | Phase 4: keep `main`/`test`; bot branches handled in Phase 6 |
| 6 Dead code removed after each upgrade | Phase 7, deletion-only commits |
| 7 DRY/KISS/YAGNI/SOLID/DDD/EDA | KISS/YAGNI apply; DRY/SOLID/Clean/DDD/EDA do not (justified in Phase 8) |
| 8 Best practices per phase | Each phase's checklist in `PROMPT.md` is the exit criterion |
| 9 Final report | Phase 17 (after all phases) |
| 10 Skill learning loop | No Phase-3 React skill exists; the handoff carries the proposal (R9) |
| 11 Autonomous mode | Gate 10 is parked as `needs-approval`; Phase 4 does not start until approved |
| 12 No AI attribution | Commit/PR text authored by Rasim only |
| 13 Discussions & Wiki | Already enabled (verified via `gh repo view`) |
| 14 Dependabot | Phase 4 adds `.github/dependabot.yml` (weekly, Monday 06:00 UTC, limits 10/5) |

## 13. Approval and rollback

- **Gate 10:** this plan requires sign-off before Phase 4. Status: `needs-approval` in `projects/info/state/APPROVALS.md`.
- **Rollback for the audit itself:** the four docs are on branch `phase-3/audit` in PR form; closing the PR and deleting the branch removes them. No production code was touched.
- **Rollback for later phases:** each phase is one PR; revert the merge commit to restore the baseline. The baseline is the current broken-runtime state, so a revert does not make the app worse.