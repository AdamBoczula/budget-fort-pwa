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
| `libs/shared/local-db` (`local-db`) | Shared local persistence (Dexie/IndexedDB) |

> **Legacy:** `packages/**` (shop, api, models) is demo/template code and is **not** part of the active application. Do not build new features there.

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

## Mandatory Verification Command

Before opening a PR, run:

```bash
npm exec nx affected -t lint test build e2e
```

## Governance

- Agents may update documentation without approval.
- Agents must request approval before changing code or tests (unit/component/e2e).

## Critical Guardrails

- **Money logic** must live in dedicated pure utility functions (no external money library for MVP). Round half-up to 2 decimals for display; keep raw values for intermediate calculations.
- **Timezone:** canonical reporting timezone is `Europe/Warsaw`. Centralize all month/year boundary calculations in one utility layer.
- **Offline/PWA:** transaction create/edit must work offline-first via IndexedDB. Protect these flows with tests.
- **Architecture:** keep transaction domain logic cohesive across `libs/transaction/**`. Respect Nx module boundaries and tags. Do not bypass boundaries for quick fixes.
- **State:** use Angular Signals + lightweight services + resources APIs. Avoid heavy global state frameworks for MVP.
- **i18n:** user-facing strings must be added to the xliff files in `apps/budget-fort/src/locale/` (e.g., `messages.en.xlf`).
