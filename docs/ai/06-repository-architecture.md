# Repository Architecture

Last updated: 2026-08-18

## Overview

Budget Fort is an Nx monorepo for a home-budget PWA. The active application is an Angular PWA that is offline-first and persists data locally via IndexedDB (Dexie).

This document is the authoritative map of the repository. Use it to understand where code lives, which boundaries exist, and where to put new code.

## Project Inventory

### Active Projects

| Project | Path | Purpose | Tags |
| ------- | ---- | ------- | ---- |
| `budget-fort` | `apps/budget-fort` | Angular home-budget PWA (main application, shell, routing, i18n) | `type:app` |
| `budget-fort-e2e` | `apps/budget-fort-e2e` | Playwright e2e tests for the application | — |
| `feature-transaction` | `libs/transaction/src/lib/feature-transaction` | Transaction feature (Home screen, quick add, last transactions, state facade) | `type:feature` |
| `data-access-transaction` | `libs/transaction/src/lib/data-access-transaction` | Transaction data access (IndexedDB CRUD via Dexie) | `type:data` |
| `ui-transaction` | `libs/transaction/src/lib/ui-transaction` | Reusable transaction UI components (header, navigation drawer) | `type:ui` |
| `local-db` | `libs/shared/local-db` | Shared local persistence (Dexie/IndexedDB database instance) | `type:data` |

> **Legacy (do not build here):** `packages/**` (shop, api, models) are Nx template/demo code. They are **not** part of the active application and are not mapped in `tsconfig.base.json`. Do not add new features there.

## Path Mappings (`tsconfig.base.json`)

| Alias | Target |
| ----- | ------ |
| `@feature-transaction` | `libs/transaction/src/lib/feature-transaction/src/index.ts` |
| `@data-access-transaction` | `libs/transaction/src/lib/data-access-transaction/src/index.ts` |
| `@ui-transaction` | `libs/transaction/src/lib/ui-transaction/src/index.ts` |
| `local-db` | `libs/shared/local-db/src/index.ts` |

## Module Boundaries (ESLint `enforce-module-boundaries`)

Dependency constraints from `eslint.config.mjs`:

| Source tag | May depend on |
| ---------- | ------------- |
| `type:app` | `type:app`, `type:feature` |
| `type:feature` | `type:feature`, `type:data`, `type:ui` |
| `type:data` | `type:data` |

Implications:

- The app (`budget-fort`) may only import `type:feature` libraries. It must **not** import `data-access-*`, `ui-*`, or `local-db` directly.
- Feature libraries (`feature-transaction`) may import the data-access layer, UI components, and other features — but never the app.
- Data libraries (`data-access-transaction`, `local-db`) may only depend on other data libraries. They must not contain UI or feature logic.
- `local-db` is a shared data library and is the natural dependency target for `data-access-transaction`.

## Public API Contracts

### `@feature-transaction` (`libs/transaction/src/lib/feature-transaction/src/index.ts`)

- Exports `featureTransactionRoutes: Route[]` from `lib/lib.routes`.
- Routes: `''` → `TransactionShellComponent` with child `''` → `HomePageScreen`.

### `@data-access-transaction` (`libs/transaction/src/lib/data-access-transaction/src/index.ts`)

- `TransactionService`
- `Transaction` type
- `CategoryService`
- `Category` type

### `@ui-transaction` (`libs/transaction/src/lib/ui-transaction/src/index.ts`)

- `UiTransactionComponent`
- `TransactionHeaderToolbarComponent`
- `TransactionNavigationDrawerComponent`

### `local-db` (`libs/shared/local-db/src/index.ts`)

- `LocalDbService`
- `BUDGET_FORT_DB_NAME`, `BUDGET_FORT_DB_VERSION`
- `TRANSACTION_DB_TOKEN`, `CATEGORY_DB_TOKEN`
- `BUDGET_FORT_DB_STORES`, `BudgetFortStoreName`

## Domain Data Model

### Transaction

```ts
type Transaction = {
  id: string;
  amount: number;
  date: string;
  categoryId: string;
  accountId: string;
  comment?: string;
};
```

### Category

Defined in `data-access-transaction` (`model/category.type.ts`).

### IndexedDB Stores (`local-db`)

- `transaction` — keyed by `id`, `date`, `categoryId`, `accountId`
- `category` — keyed by `id`, `sortOrder`, `isHidden`, `name`

## Where To Put New Code

| Concern | Location |
| ------- | -------- |
| New screen/page inside the transaction feature | `libs/transaction/src/lib/feature-transaction/src/lib/` |
| New state facade / feature business logic | `libs/transaction/src/lib/feature-transaction/src/lib/service/` |
| New reusable transaction UI component | `libs/transaction/src/lib/ui-transaction/src/lib/` |
| New CRUD/store logic for entities | `libs/transaction/src/lib/data-access-transaction/src/lib/data-access-transaction/` |
| Shared IndexedDB/Dexie concerns | `libs/shared/local-db/src/lib/` |
| App-shell concerns (routing shell, theme, i18n) | `apps/budget-fort/src/app/` |

Rules of thumb:

- Keep the transaction domain cohesive across `feature-transaction`, `data-access-transaction`, and `ui-transaction`.
- Do not create new libraries under `apps/budget-fort` for domain logic — use the `libs/transaction/**` tree.
- Do not create new libraries under `packages/**` — that tree is legacy.
- If you need a **new domain** (e.g., categories as a first-class feature), follow the same pattern: create `libs/<domain>/feature-*`, `data-access-*`, `ui-*` libraries under `libs/`, not under `apps/` or `packages/`.

## Example: "Add a New Transaction"

This is the canonical flow an agent should follow when implementing or modifying transaction features:

1. **Route registration:**
   - `apps/budget-fort/src/app/app.routes.ts` lazily loads `@feature-transaction`.
   - `libs/transaction/src/lib/feature-transaction/src/lib/lib.routes.ts` declares the screen routes.

2. **Data access (`data-access-transaction`):**
   - `TransactionService` in `libs/transaction/src/lib/data-access-transaction/src/lib/data-access-transaction/transaction/transaction.service.ts` performs CRUD against the `transaction` store via `LocalDbService`.
   - `TransactionStore` wraps IndexedDB upsert/delete/list operations.

3. **Feature / State (`feature-transaction`):**
   - `TransactionStateFacade` (in `lib/service/transaction-state/`) exposes Signals for `transactions`, `loading`, `error` and command methods (`load`, `add`, `edit`, `delete`).
   - The facade calls `TransactionService` and maps raw records to UI view models.

4. **UI components (`ui-transaction` or local components in the feature):**
   - `TransactionFormComponent` (in the feature) emits save events; `HeaderComponent` renders month/balance; `LastTransactionComponent` renders groups and emits edit/delete events.
   - Reusable chrome (toolbar, navigation drawer) lives in `ui-transaction`.

5. **Tests:**
   - Unit: facade + services (Vitest).
   - Component: `@testing-library/angular` for form interactions and summary rendering.
   - E2E: `apps/budget-fort-e2e` (Playwright) for critical paths (add/edit, offline).
   - Critical flows must be covered per `docs/ai/03-testing-quality-gates.md`.

## i18n

- Source locale: `pl` (Polish).
- Additional locale: `en`.
- The `budget-fort` build has configurations `pl`/`en` (e.g. `production`, `production-en`, `development`, `development-en`).
- User-facing strings must be added to `apps/budget-fort/src/locale/messages.en.xlf`.

## Verification

Before opening a PR:

```bash
npm exec nx affected -t lint test build e2e
```
