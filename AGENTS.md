# Budget fort application

This is monorepo of PWA application - for home budget app.
<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## Repository Overview

**Budget Fort** is a home-budget PWA (Angular + Nx) focused on tracking spending by category. It is offline-first and uses IndexedDB for local persistence.

### Active Projects

| Project | Purpose |
| ------- | ------- |
| `apps/budget-fort` | Angular home-budget PWA (main application) |
| `apps/budget-fort-e2e` | Playwright e2e tests |
| `libs/transaction/feature-transaction` (`@feature-transaction`) | Transaction feature (Home screen, quick add, last transactions) |
| `libs/transaction/data-access-transaction` (`@data-access-transaction`) | Transaction data access (IndexedDB CRUD) |
| `libs/transaction/ui-transaction` (`@ui-transaction`) | Transaction UI components |
| `libs/budget/feature-budget` (`@feature-budget`) | Budget feature (settings, planning, aggregation) |
| `libs/budget/data-access-budget` (`@data-access-budget`) | Budget data access (CRUD) |
| `libs/budget/ui-budget` (`@ui-budget`) | Budget UI components (progress bar, period utils) |
| `libs/shared/local-db` (`local-db`) | Shared local persistence (Dexie/IndexedDB) |

> **Legacy:** `packages/**` (shop, api, models) is demo/template code and is **not** part of the active application. Do not build new features there.

## Spec-Driven Development (SDD)

This project uses **Spec-Driven Development** for new features and significant changes.
The full workflow is defined in `docs/specs/01-spec-workflow.md`.

### Quick SDD overview

1. **Analysis** — invoke the Business Analyst skill (`.opencode/skills/business-analyst.md`) to gather requirements
2. **Architecture** — design module structure and ADRs (if needed), update the spec
3. **Implementation (parallel)** — Dev (TDD + code + "Implemented in" updates) || Tester (E2E tests)
4. **Quality Gate** — `npm exec nx affected -t lint test build e2e`
5. **Done** — code ready, reviewed locally by user

For bug fixes and small refactors, skip to the regular workflow below.

### SDD traceability

- Every new source file must start with: `// spec: docs/specs/<domain>/<name>.md`
- Every test must annotate which AC it covers: `// covers: docs/specs/<domain>/<name>.md#AC-N`
- During implementation, update the spec file's "Implemented in" table continuously

## AI Agent Read-Order

Before making changes, read these files in order:

1. `AGENTS.md`
2. `README.md`
3. `nx.json`
4. `tsconfig.base.json`
5. `docs/ai/00-ai-readiness-overview.md`
6. `docs/ai/01-project-context-mvp.md`
7. `docs/ai/02-agent-operating-model.md`
8. `docs/ai/03-testing-quality-gates.md`
9. `docs/ai/05-technology-stack-decisions.md`
10. `docs/ai/06-repository-architecture.md`
11. `docs/specs/01-spec-workflow.md` (if working on a new feature)

## Mandatory Verification Command

Before marking a task as complete, run:

```bash
npm exec nx affected -t lint test build e2e
```

## Governance

- Agents may update documentation without approval.
- Agents must request approval before changing code or tests (unit/component/e2e).
## Mandatory Testing Workflow

For **any** code change (new feature, refactor, bug fix), the agent MUST create or update tests **at the same time as the code change**, without waiting for user reminders. This applies to:

1. **Unit tests** (Vitest) – services, utilities, pure functions, dumb components
   - Framework: Vitest + `TestBed` or direct function testing
   - Location: `*.spec.ts` next to the source file

2. **Component/Integration tests** (`@testing-library/angular`) – user-facing component behavior
   - Use `render()`, `screen` queries, `userEvent` for interactions
   - Test: rendering states, form submissions, dialog open/close, computed outputs
   - Location: `*.spec.ts` next to the component file

3. **E2E tests** (Playwright) – critical user flows across the full stack
   - Use `page.goto()`, `page.locator()`, `expect().toBeVisible()`
   - Location: `apps/budget-fort-e2e/src/*.spec.ts`
   - Base URL is set via `test.use({ baseURL: 'http://localhost:4200' })`

### When to write each layer

| Change type | Unit tests | Component tests | E2E tests |
|-------------|-----------|-----------------|-----------|
| New service / utility | ✅ Required | — | — |
| New component | ✅ (class logic) | ✅ Required | — |
| New feature / screen | ✅ | ✅ Required | ✅ (critical path) |
| Bug fix | ✅ (regression) | ✅ (if component) | ✅ (if critical path) |
| Refactor (no behavior change) | ✅ (existing must pass) | ✅ (existing must pass) | — |
| Refactor (behavior changes) | ✅ Updated | ✅ Updated | ✅ Updated |

### Testing patterns used in this project

- **Services**: `TestBed.configureTestingModule` with mock providers, `firstValueFrom` for observables
- **Component (testing-library)**: `await render(Component, { providers: [...] })` + `screen.getByText/Role/LabelText`
- **Component (TestBed)**: `TestBed.createComponent(Component)` + `fixture.debugElement.query(By.css(...))`
- **Dialog/overlay components**: mock `MatDialogRef` and `MAT_DIALOG_DATA`
- **IndexedDB-dependent components**: mock the data-access service (e.g. `CategoryService`, `TransactionState`)
- **E2E**: `page.goto('/feature-transaction')`, wait for grid/dialog, use `[i18n="@@key"]` or `getByPlaceholder` for i18n elements

### Verification after every change

After implementing code + tests, run:

```bash
npm exec nx affected -t lint test build e2e
```

If the full suite is too slow for iteration, run project-specific tests first:
```bash
npm exec nx test <project-name> --skip-nx-cache
npm exec nx build <project-name> --skip-nx-cache
```

And run the full `nx affected` command before marking the task complete.

### Existing test commands

```bash
npm exec nx test data-access-transaction --skip-nx-cache    # 12 tests
npm exec nx test feature-transaction --skip-nx-cache        # 187 tests
npm exec nx test feature-budget --skip-nx-cache             # 18 tests (budget-state + settings-budget-screen)
npm exec nx test budget-fort --skip-nx-cache                # 4 tests (1 pre-existing fail)
npm exec nx e2e budget-fort-e2e --skip-nx-cache             # 5 e2e tests
```

## Critical Guardrails

- **Money logic** must live in dedicated pure utility functions (no external money library for MVP). Round half-up to 2 decimals for display; keep raw values for intermediate calculations.
- **Timezone:** canonical reporting timezone is `Europe/Warsaw`. Centralize all month/year boundary calculations in one utility layer.
- **Offline/PWA:** transaction create/edit must work offline-first via IndexedDB. Protect these flows with tests.
- **Architecture:** keep transaction domain logic cohesive across `libs/transaction/**`. Respect Nx module boundaries and tags. Do not bypass boundaries for quick fixes.
- **State:** use Angular Signals + lightweight services + resources APIs. Avoid heavy global state frameworks for MVP.
- **i18n:** user-facing strings must be added to the xliff files in `apps/budget-fort/src/locale/` (e.g., `messages.en.xlf`).
- **Component design:** follow the decomposition rules in `docs/ai/02-agent-operating-model.md#component-design-standards`. Use Container/Presenter pattern for data-heavy screens. One concern per component. Container components MUST use inline templates. Extracted aggregation logic goes into dedicated `@Service()` classes. Avoid mega-components.
- **Angular 22 specifics:** omit `standalone: true` (now default). Use `@Service()` instead of `@Injectable({ providedIn: 'root' })`. Prefer Reactive Forms over template-driven. Template MUST be inline (`template: \`...\``). Styles MUST be in a separate `.scss` file (`styleUrl: './*.component.scss'`) — never `styles: \`...\`` inline.
- **CSS:** BEM nesting (`&__element`, `&--modifier`) is standard in SCSS files. Use `styleUrl` to a `.scss` file for all components.

## UI/UX Review (Phase [4b])

After the quality gate passes, you can trigger an automated UI/UX/Accessibility/Responsive review:

```
/qa-review
```

This invokes the **QA Coordinator**, which spawns 4 subagents in parallel:
- **UI Reviewer** — visual consistency, layout, typography, component states
- **UX Analyzer** — user experience, Nielsen's heuristics, click efficiency
- **A11y Auditor** — WCAG 2.1 AA, Axe-core, keyboard, ARIA, contrast
- **Responsive Checker** — viewport breakpoints, touch targets, overflow

The review is **optional** — it does NOT block the pipeline. Results are saved to
`docs/qa/YYYY-MM-DD-qa-report.md`. See `.opencode/agents/qa-coordinator.md` for details.

### MCP servers used by QA subagents

| MCP Server | Purpose |
|------------|---------|
| Playwright MCP | Browser automation, navigation, screenshots, viewport resizing |
| Chrome DevTools MCP | Axe-core audits, ARIA tree inspection, contrast checks |
| GitHub MCP | Optional: create GitHub Issues from QA reports |

### Agent models

| Agent | Model | Why |
|-------|-------|-----|
| QA Coordinator | DeepSeek-V4-Pro | Orchestration, report merging, decision-making |
| UI Reviewer | DeepSeek-V4-Flash | Visual analysis — doesn't need deep reasoning |
| UX Analyzer | DeepSeek-V4-Flash | Heuristic evaluation — procedural task |
| A11y Auditor | DeepSeek-V4-Flash | Audits are tool-driven, not reasoning-heavy |
| Responsive Checker | DeepSeek-V4-Flash | Viewport testing is procedural |
