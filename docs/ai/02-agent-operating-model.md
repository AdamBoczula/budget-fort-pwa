# Agent Operating Model

Last updated: 2026-07-22

## Preferred Agent Roles

The team wants these AI roles available:
- Feature builder
- Refactoring assistant
- Test generator
- Release/CI monitor
- Architecture guard
- Docs maintainer

## Permission Model

Allowed without approval:
- Documentation updates

Requires explicit approval:
- Source code changes
- Unit test changes
- Component/integration test changes
- E2E test changes

## Mandatory Agent Workflow

For each task, the agent should:
1. Read required context files listed in docs/ai/00-ai-readiness-overview.md.
2. Restate scope and identify if task affects high-risk areas.
3. Propose smallest safe change.
4. Implement only after approval if code/test changes are required.
5. Run the mandatory verification command (see docs/ai/03-testing-quality-gates.md for the authoritative quality gates) and summarize results.
6. Update docs if behavior or decisions changed.

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

Each component must handle **exactly one concern**. When a component covers multiple concerns (e.g., categories + theme + currency), extract each concern into its own component.

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

### Page-as-Orchestrator Pattern

A "page" or "screen" component should be a **thin layout** that composes child section components and adds page-level chrome (dividers, titles). It must not contain data-fetching logic, state management, or business operations that belong in child components.

### Self-Contained Section Components

Each section component (child of a page) manages:
- Its own data fetching (resource API, signals)
- Its own service injections (data-access, storage)
- Its own dialog/overlay interactions
- Its own template, styles, and spec file in a dedicated folder

Do **not** lift all state to the parent page and pass it down via inputs/outputs unless the state is genuinely shared between sections.

### Folder Structure

```
settings-screen/
├── settings-screen.ts                  # orchestration page component
├── settings-screen.html
├── settings-screen.scss
├── settings-screen.spec.ts
├── settings-constants.ts               # extracted domain constants
├── theme-utils.ts                      # shared utilities
├── settings-categories-section/        # self-contained child component
│   ├── settings-categories-section.ts
│   ├── settings-categories-section.html
│   ├── settings-categories-section.scss
│   └── settings-categories-section.spec.ts
├── settings-theme-selector/
│   └── ...
└── settings-currency-selector/
    └── ...
```

### Extract Constants and Utilities

- Move domain types, options, storage keys, and default values to `*-constants.ts` files — never leave them inline in the component class.
- Move duplicated logic (e.g., `applyThemeClass`) to shared utility files so multiple consumers use the same implementation.

### The "Mega-Component" Threshold

Decompose a component when it exceeds **any** of:
- **~3 distinct responsibilities** (e.g., categories CRUD + theme + currency = 3 → split)
- **~200 lines** of TypeScript logic
- **~80 lines** of template HTML
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

## Review Focus For AI-Generated PRs

Reviewers should prioritize:
- Correctness and precision in money calculations
- Offline/PWA edge cases (refresh, reconnect, retry, conflict)
- Regression risk in transaction create/edit flows
- Tests proving critical flow behavior
- Boundary compliance

## Suggested Task Labels

Use these labels in issues/PR descriptions to guide agents:
- area:transaction
- area:category
- area:reporting
- area:pwa-offline
- risk:money
- risk:offline
- type:test
- type:refactor

## Quality Gates

The authoritative quality gates are defined in `docs/ai/03-testing-quality-gates.md`. Before opening a PR, run the mandatory verification command and confirm the gates listed there.
