# Agent Operating Model

Last updated: 2026-10-16

## Preferred Agent Roles & Models

Model split: **2 roles on Gemini Argon (Pro)** for tasks with high conceptual and architectural complexity; **remaining roles on Gemini Flash** for speed, low latency, and token efficiency:

| Role | Model | Core Responsibility | Allowed Skills |
|------|-------|---------------------|----------------|
| **SDLC Orchestrator** | Gemini Flash | Task classification, dynamic workflow selection, agent dispatcher | `nx-workspace` |
| **Architect** | **Gemini Argon (Pro)** | Nx architecture, IndexedDB/Dexie schemas, service contracts, ADRs | `nx-workspace`, `nx-generate` |
| **UI/UX Designer** | **Gemini Argon (Pro)** | Screen state wireframes, ergonomics, Anti-UI-Slop, Angular Material | `anti-ui-slop` |
| **Business Analyst (BA)** | Gemini Flash | Requirements drill-down, structured specs in `docs/specs/` | *(none / purely analytical)* |
| **Automation Tester** | Gemini Flash | E2E Playwright tests (`apps/budget-fort-e2e/`) | `nx-run-tasks`, `nx-workspace` |
| **Senior Developer** | Gemini Flash | TDD implementation, Vitest tests, clean Angular 22 code | `anti-ui-slop`, `conventional-commit`, `nx-generate`, `nx-run-tasks`, `nx-workspace` |
| **Code Reviewer** | Gemini Flash | Static code analysis, Architect/Designer consultations, Dev feedback | `anti-ui-slop`, `nx-workspace` |
| **Security & Data Guard** | Gemini Flash | Secrets scanning (`scan-secrets.sh`), IndexedDB privacy integrity | `nx-workspace` |
| **QA Gatekeeper** | Gemini Flash | Runs quality gate, Antigravity internal browser verification & screenshot evidences | `nx-run-tasks`, `nx-workspace` |
| **DevOps & Release Monitor** | Gemini Flash | GitHub Actions CI/CD, PWA production build, Firebase deployment | `conventional-commit`, `nx-run-tasks`, `nx-workspace` |

## Dynamic SDLC Workflows (Orchestrated by SDLC Orchestrator)

The Orchestrator automatically selects the minimal, optimal agent chain based on request type:

1. **New Feature / Major Redesign:**
   `Orchestrator` $\rightarrow$ `BA` $\rightarrow$ `UI/UX Designer (Argon)` $\rightarrow$ `Architect (Argon)` $\rightarrow$ `Automation Tester` $\rightarrow$ `Senior Dev (TDD)` $\rightarrow$ `Code Reviewer` $\rightarrow$ `QA Gatekeeper` $\rightarrow$ `DevOps`
2. **Bugfix (Fast-track regression fix):**
   `Orchestrator` $\rightarrow$ `BA (reproduction and criteria)` $\rightarrow$ `Senior Dev (regression Vitest test + fix)` $\rightarrow$ `Code Reviewer` $\rightarrow$ `QA Gatekeeper`
3. **Improvement / UI Polish:**
   `Orchestrator` $\rightarrow$ `UI/UX Designer (Argon)` $\rightarrow$ `Senior Dev (BEM/Material)` $\rightarrow$ `Code Reviewer` $\rightarrow$ `QA Gatekeeper (screenshots)`
4. **Technical Task / Refactoring / Database Migration:**
   `Orchestrator` $\rightarrow$ `Architect (Argon, if touching data models/Nx)` $\rightarrow$ `Senior Dev` $\rightarrow$ `Security Guard` $\rightarrow$ `Code Reviewer` $\rightarrow$ `QA Gatekeeper` $\rightarrow$ `DevOps`

For **bug fixes** and **small refactors**, use the simpler workflow below (Mandatory Agent Workflow).

To activate the Business Analyst role, invoke `docs/ai/agents/business-analyst.md`.

### SDD Traceability Rules

When implementing code from a spec:
- Every new source file must have: `// spec: docs/specs/<domain>/<name>.md`
- Every test must have: `// covers: docs/specs/<domain>/<name>.md#AC-N`
- Dev updates the spec's "Implemented in" section **continuously** during implementation

### ADR (Architecture Decision Records)

The Architect creates ADRs in phase 2 for architectural decisions that:
- Involve choosing between multiple solutions
- Have long-term project impact
- Require justification or may be controversial

ADRs are stored in `docs/adr/<NNN>-<title>.md`. See `docs/adr/adr-template.md` for the template.

## Permission Model

Allowed without approval:
- Documentation updates
- Spec creation and updates (in `docs/specs/`)
- ADR creation and updates (in `docs/adr/`)

Requires explicit approval:
- Source code changes
- Unit test changes
- Component/integration test changes
- E2E test changes

## Mandatory Agent Workflow

For each task, the agent should:
1. Read required context files listed in docs/ai/00-ai-readiness-overview.md.
2. Check if SDD applies (new feature / significant change → use SDD pipeline).
3. Restate scope and identify if task affects high-risk areas.
4. Propose smallest safe change.
5. Implement only after approval if code/test changes are required.
6. Run the mandatory verification command (see docs/ai/03-testing-quality-gates.md for the authoritative quality gates) and summarize results.
7. Update docs if behavior or decisions changed.

## Architecture Guard Rules

- Respect existing Nx boundaries and tags.
- Do not bypass module boundaries for quick fixes.
- Prefer changes in the closest domain library instead of app-level duplication.
- Keep transaction domain logic cohesive across data, feature, and ui libraries.
- Do not build new features in `packages/**` — that code is legacy/demo.

## Coding Standards Baseline

Agents should enforce these defaults unless a task explicitly requires deviation:
- Use domain-first folder placement for business logic.
- Keep money and date logic in pure utility functions.
- Use explicit return types on exported functions.
- Do not introduce `any` in new code.
- Apply fail-fast input validation at domain and API boundaries.

## Component Design Standards

These rules describe how feature components should be structured and when to decompose them.

### Single Responsibility Per Component

Each component must handle **exactly one concern**. When a component covers multiple concerns (e.g., categories + theme + currency, or data aggregation + form management + UI rendering), extract each concern into its own component.

```typescript
// ✅ DO: page orchestrator composes separate section components
@Component({
  template: `
    <transaction-settings-categories-section />
    <transaction-settings-theme-selector />
    <transaction-settings-currency-selector />
  `,
})
export class SettingsPageScreen {}

// ❌ DON'T: one component managing categories, theme, and currency inline
```

### Container / Presenter Pattern

For data-heavy screens, use the **Container / Presenter** (smart / dumb) split:

- **Container (smart)**: owns data fetching (resources, service injection), form ownership, and state. Passes data to children via **input bindings**. Template is **inline** (`template: \`...\``). Styles go to a separate `.scss` file via `styleUrl`.
- **Presenter (dumb)**: receives data via `input()`, renders UI. Template is **inline** (simple components) or `templateUrl` (complex, >30 lines). Styles go to a separate `.scss` file via `styleUrl`. Knows nothing about services.

**Style rule**: ALL components use `styleUrl: './*.component.scss'` — never `styles: \`...\`` inline. SCSS files allow proper BEM nesting with `&`. Only the template stays inline.

```typescript
// ✅ Container: thin orchestrator, inline template, SCSS file, passes data via bindings
@Component({
  selector: 'budget-settings-budget-screen',
  imports: [ChildA, ChildB],
  template: `
    <h1>Title</h1>
    <child-a [data]="agg.someData()" [control]="getControl(id)" />
    <child-b [summary]="agg.summary()" />
    <button (click)="onSave()">Save</button>
  `,
  styleUrl: './settings-budget-screen.component.scss',
})
export class ContainerComponent { ... }

// ✅ Presenter: pure rendering, inline template, SCSS file, inputs only
@Component({
  selector: 'child-a',
  template: `<div class="child">{{ data().label }}</div>`,
  styleUrl: './child-a.component.scss',
})
export class ChildAComponent {
  readonly data = input.required<SomeType>();
  readonly control = input.required<FormControl>();
}
```

**When to use Container/Presenter:**
- A screen component exceeds ~150 lines of TS or ~60 lines of inline template
- The template has 3+ distinct visual sections (cards, forms, summaries)
- Aggregation/computation logic can be extracted to a dedicated service

### Aggregation Service Pattern

When a container component computes multiple derived values from raw data (spending totals, month-over-month comparisons, category breakdowns), extract that logic into an **aggregation service** provided at the component level (not root).

```typescript
// ✅ DO: dedicated aggregation service with signal inputs → computed outputs
@Service()
export class BudgetAggregationService {
  readonly transactions = signal<Transaction[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly currentMonthSpent = signal(0);
  readonly formVersion = signal(0);

  readonly overallBudget = computed(() => { ... });
  readonly previousMonthSummary = computed(() => { ... });
  readonly monthComparison = computed(() => { ... });

  bumpFormVersion(): void { this.formVersion.update(v => v + 1); }
}

// Container uses it:
const agg = inject(BudgetAggregationService);
effect(() => agg.transactions.set(txsResource.value() ?? []));
```

### Self-Contained Section Components

Each section component (child of a container) manages:
- Its own **inline template** (simple) or `templateUrl` (complex >30 lines)
- Its own **SCSS file** (`styleUrl: './*.component.scss'`)
- Inputs only — no service injections, no data fetching
- Its own spec file in a dedicated folder

Do **not** lift all state to the parent page and pass it down via inputs/outputs unless the state is genuinely shared between sections.

### Inline Template Rule

**All components** use `template: \`...\`` (inline template) — never `templateUrl`.

**All components** use `styleUrl: './*.component.scss'` for styles — never `styles: \`...\`` inline.

SCSS files support proper BEM nesting (`&__element`, `&--modifier`) which Angular inline `styles` does NOT support.

Container components: if the inline template exceeds ~60 lines, decompose into smaller presenters.
Presenter components with >30 lines of template: consider further decomposition into sub-presenters.

### Folder Structure

```
settings-budget-screen/                    # container
├── settings-budget-screen.component.ts    # orchestrator (inline template + styleUrl)
├── settings-budget-screen.component.scss  # page-level styles (SCSS)
└── settings-budget-screen.component.spec.ts
budget-current-month-card/                 # presenter (dumb)
├── budget-current-month-card.component.ts # inline template + styleUrl
├── budget-current-month-card.component.scss
└── budget-current-month-card.component.spec.ts
budget-category-card/                      # presenter (dumb)
├── budget-category-card.component.ts
├── budget-category-card.component.scss
└── budget-category-card.component.spec.ts
services/
├── budget-aggregation.service.ts          # extracted computation logic
└── budget-aggregation.service.spec.ts
```

### CSS Rules

**Always use `styleUrl` to a `.scss` file.** SCSS supports full BEM nesting. Angular inline `styles` does NOT support BEM nesting (`&__element`, `&--modifier`).

```scss
// ✅ DO — styleUrl: './my.component.scss'
.card {
  &__header { display: flex; }
  &--active { color: red; }
}

// ❌ DON'T — styles: `...` inline (BEM nesting broken, harder to maintain)
@Component({ styles: `.card__header { ... }` })
```

### Extract Constants and Utilities

- Move domain types, options, storage keys, and default values to `*-constants.ts` files — never leave them inline in the component class.
- Move duplicated logic (e.g., `isInMonth`) to shared utility files so multiple consumers use the same implementation.

### The "Mega-Component" Threshold

Decompose a component when it exceeds **any** of:
- **~3 distinct responsibilities** (e.g., data aggregation + form + UI = 3 → split to container + aggregation service + presenters)
- **~150 lines** of TypeScript logic
- **~60 lines** of inline template HTML (containers) or **~80 lines** of template (presenters)
- **5+ service/dependency injections** in a single component

### Selector Naming Convention

```
transaction-<feature-area>-<component-purpose>
```

Examples from this codebase:
- `transaction-settings-screen`
- `transaction-settings-categories-section`
- `transaction-settings-theme-selector`
- `transaction-settings-currency-selector`
- `transaction-category-edit-dialog`
- `transaction-shell`

### Material Module Imports

Import only the Material modules each component actually uses. Do not define global Material module arrays — prefer imports directly in each component's `@Component.imports` array.

## Review Focus

User should prioritize when reviewing locally:
- Correctness and precision in money calculations
- Offline/PWA edge cases (refresh, reconnect, retry, conflict)
- Regression risk in transaction create/edit flows
- Tests proving critical flow behavior
- Boundary compliance

## Suggested Task Labels

Use these labels in task descriptions to guide agents:
- area:transaction
- area:category
- area:reporting
- area:pwa-offline
- risk:money
- risk:offline
- type:test
- type:refactor

## Quality Gates

The authoritative quality gates are defined in `docs/ai/03-testing-quality-gates.md`. Before marking a task complete, run the mandatory verification command and confirm the gates listed there.

## Manual QA (Optional, Outside Workflow)

Manual QA is performed **optionally** after the formal SDD workflow completes (after Quality Gate).
It does **not** block the pipeline. The manual QA checklist is in `docs/ai/03-testing-quality-gates.md#manual-qa-checklist`.

## Automated UI/UX Review (Phase [4b], Optional)

In addition to manual QA, an automated UI/UX/A11y/Responsive review can be triggered by running
`/qa-review` in OpenCode. The **QA Coordinator** subagent orchestrates four specialized subagents:

| Subagent | Focus | Tools | Target Profile |
|----------|-------|-------|----------------|
| `ui-reviewer` | Visual consistency, layout, typography, component states | Playwright MCP | Flash / Fast multimodal |
| `ux-analyzer` | User experience, Nielsen's heuristics, click efficiency | Playwright MCP | Flash / Fast |
| `a11y-auditor` | WCAG 2.1 AA, Axe-core, ARIA, keyboard navigation | Chrome DevTools MCP + Playwright MCP | Flash / Fast |
| `responsive-checker` | Viewport testing, touch targets, layout integrity | Playwright MCP | Flash / Fast |

Results are compiled into a unified report at `docs/qa/YYYY-MM-DD-qa-report.md`. The review
does **not** block the pipeline — it is an informational aid for the developer.

See `docs/ai/agents/qa-coordinator.md` for the full workflow.