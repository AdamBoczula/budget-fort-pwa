# Budget Fort — Home Budget PWA

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

A monorepo (Nx) for **Budget Fort**, a home-budget PWA focused on helping users track spending by category.

## 📦 Project Overview

This repository contains a production-ready Angular monorepo with:

- **1 Application**

  - `budget-fort` — Angular home-budget PWA (offline-first, IndexedDB persistence)

- **1 E2E suite**

  - `budget-fort-e2e` — Playwright tests for the application

- **Active libraries**

  - `@feature-transaction` — Transaction feature (Home screen, quick add, last transactions)
  - `@data-access-transaction` — Transaction data access layer (IndexedDB CRUD)
  - `@ui-transaction` — Transaction UI components (header toolbar, navigation drawer)
  - `local-db` — Shared local persistence (Dexie/IndexedDB)

> **Note:** The `packages/**` directory contains legacy/demo template code (shop, api, models) that is **not** part of the active application. Do not build new features there.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Serve the application (default locale)
npm start

# Serve the application with English locale
npm run start:en

# Build all projects
npm exec nx run-many -t build

# Run tests
npm exec nx run-many -t test

# Lint all projects
npm exec nx run-many -t lint

# Run e2e tests
npm exec nx run budget-fort-e2e:e2e

# Run tasks in parallel
npm exec nx run-many -t lint test build e2e --parallel=3

# Visualize the project graph
npm exec nx graph
```

## 🏗️ Project Structure

```
├── apps/
│   ├── budget-fort/       - Angular home-budget PWA
│   └── budget-fort-e2e/   - Playwright e2e tests
├── libs/
│   ├── transaction/
│   │   ├── feature-transaction/     - Transaction feature (Home screen, quick add, list)
│   │   ├── data-access-transaction/ - Transaction data access (IndexedDB CRUD)
│   │   └── ui-transaction/          - Transaction UI components
│   └── shared/
│       └── local-db/                - Shared local persistence (Dexie/IndexedDB)
├── packages/             - LEGACY/demo code (not part of active app)
├── docs/ai/              - AI agent documentation (read-order, specs, decisions)
├── nx.json               - Nx configuration
├── tsconfig.base.json    - TypeScript path mappings
└── eslint.config.mjs     - ESLint with module boundary rules
```

## 🧭 Path Mappings

Defined in `tsconfig.base.json`:

| Alias                    | Target                                        |
| ------------------------ | --------------------------------------------- |
| `@feature-transaction`   | `libs/transaction/src/lib/feature-transaction` |
| `@data-access-transaction` | `libs/transaction/src/lib/data-access-transaction` |
| `@ui-transaction`        | `libs/transaction/src/lib/ui-transaction`      |
| `local-db`               | `libs/shared/local-db`                         |

## 🌍 Localization (i18n)

The application uses Angular localization (`@angular/localize`). Translation files live in `apps/budget-fort/src/locale/` (e.g., `messages.en.xlf`). When adding user-facing strings, update the xliff files accordingly.

## 🤖 AI Agent Documentation

For AI agents working in this repository, read the documentation in order:

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

## 📚 Useful Commands

```bash
# Project exploration
npm exec nx graph                                    # Interactive dependency graph
npm exec nx list                                     # List installed plugins
npm exec nx show project budget-fort --web           # View project details

# Development
npm start                                            # Serve Angular app (default locale)
npm run start:en                                     # Serve Angular app (English locale)
npm exec nx run budget-fort:build                    # Build Angular app

# Running multiple tasks
npm exec nx run-many -t build                        # Build all projects
npm exec nx run-many -t test --parallel=3            # Test in parallel
npm exec nx run-many -t lint test build              # Run multiple targets

# Affected commands (great for CI)
npm exec nx affected -t build                        # Build only affected projects
npm exec nx affected -t test                         # Test only affected projects
```

## 🎯 Adding New Features

### Generate a new Angular application:

```bash
npm exec nx g @nx/angular:app my-app
```

### Generate a new Angular library:

```bash
npm exec nx g @nx/angular:lib my-lib
```

### Generate a new Angular component:

```bash
npm exec nx g @nx/angular:component my-component --project=my-lib
```

You can use `npm exec nx list` to see all available plugins and `npm exec nx list <plugin-name>` to see all generators for a specific plugin.

## 🔗 Learn More

- [Nx Documentation](https://nx.dev/docs)
- [Angular Monorepo Tutorial](https://nx.dev/docs/getting-started/tutorials/angular-monorepo-tutorial)
- [Module Boundaries](https://nx.dev/docs/features/enforce-module-boundaries)
- [Playwright Testing](https://nx.dev/docs/technologies/test-tools/playwright)
- [Vite with Angular](https://nx.dev/docs/technologies/build-tools/vite)
- [Nx Cloud](https://nx.dev/nx-cloud)
