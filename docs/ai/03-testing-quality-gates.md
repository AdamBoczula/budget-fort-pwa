# Testing Strategy and Quality Gates For AI

Last updated: 2026-07-22

## Testing Stack

Primary stack:
- Vitest
- Angular Testing Library
- TestBed where needed
- Signal Forms for form behavior tests where applicable

## Required Test Layers

1. Unit tests
- Dumb/presentational components
- Services
- TypeScript utility/domain logic

2. Component/Integration tests
- User-centric flows around transaction forms and category selection
- Summary rendering for monthly/yearly totals

3. E2E tests
- Critical path coverage for MVP flows

## Minimum Scenario Set (MVP)

For each release candidate, ensure automated coverage for:
1. Add transaction with decimal amount and category assignment
2. Edit an existing transaction and verify updated totals
3. Monthly category summary reflects transaction changes
4. Offline add/edit behavior remains stable (no data loss in expected local flow)

## Quality Gates

Before merge, AI should run:

```bash
npm exec nx affected -t lint test build e2e
```

And confirm:
- No lint errors
- No failing unit/component tests
- No failing e2e tests in affected scope
- Build succeeds

Current enforcement policy:
- CI does not block automatically yet for missing critical-flow tests.
- Agents should still add those tests and explicitly report any missing coverage.

## Money Calculation Test Guidance

Use these mandatory checks:
- Decimal inputs (for example 0.1, 0.2, 100.23)
- Summary aggregation of multiple decimal transactions
- Edit flow where amount changes from one decimal value to another
- Formatting consistency for selected currency
- Half-up rounding behavior at 2 decimal places for display
- Serialization and parsing consistency for number-based API/storage values

## Offline/PWA Test Guidance

Include scenarios for:
- Create transaction while offline
- Edit transaction while offline
- App refresh behavior in offline state
- Return online and verify local state consistency
- IndexedDB persistence behavior for transaction create/edit data

## Non-Goals For MVP Test Automation

Not required yet unless a task explicitly requests it:
- Cloud synchronization conflict resolution
- Authentication and authorization paths
- Recurring transaction logic

## Security Checklist For AI Changes

Before merge, confirm:
- Inputs are validated on client and server boundaries.
- No secrets or credentials are introduced in client code.
- User-controlled strings are sanitized before rendering.
- Dependency risk check is tracked periodically in CI workflows.

## Manual QA Checklist

Before release candidate sign-off, confirm manually:
1. Create transaction flow works.
2. Edit transaction flow works.
3. Monthly and yearly summaries are correct.
4. Currency switch updates values consistently.
5. Theme switch works for all configured themes.
6. Offline create/edit and refresh behavior is stable.
