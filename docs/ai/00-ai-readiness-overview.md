# AI Readiness Overview

Last updated: 2026-07-22

## Purpose

This folder defines the minimum context AI agents need to work safely and effectively in this repository.

The goal is to reduce:
- Wrong assumptions about product scope
- Architecture boundary violations
- Low-value or risky code changes
- Missing tests for critical business flows

## Quick Start For Any AI Agent

Before making changes, read in this order:
1. AGENTS.md
2. README.md
3. nx.json
4. tsconfig.base.json
5. docs/ai/01-project-context-mvp.md
6. docs/ai/02-agent-operating-model.md
7. docs/ai/03-testing-quality-gates.md
8. docs/ai/05-technology-stack-decisions.md

## Workspace Facts

- Monorepo: Nx
- Frontend stack: Angular + Vite + Vitest
- Testing direction: Vitest + Angular Testing Library + TestBed where needed
- MVP domains in scope: Transactions, Categories, Reports/Analytics
- UI direction: Angular Material + custom theme tokens (2-3 themes)
- State direction: Angular Signals + lightweight services + resources APIs
- Offline persistence: IndexedDB (offline-first for transaction create/edit)

## Primary Quality Objective

AI-generated changes should prioritize correctness in money logic and reliability of offline/PWA flows.

## Definition of Done (AI Changes)

A change is not done until all are true:
- Unit tests pass
- Component/integration tests for business flow pass
- E2E critical path passes
- Nx affected tasks pass
- No architecture boundary violations
- Performance budget is not degraded
- Security checklist items are addressed
- Manual QA sign-off is prepared

## Preferred Validation Command

Use this command before opening a PR:

```bash
npm exec nx affected -t lint test build e2e
```

## Governance Rule

- Agents may update documentation without approval.
- Agents must request approval before changing code or tests (unit/component/e2e).
