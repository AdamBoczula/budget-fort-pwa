# Technology Stack Decisions (MVP)

Last updated: 2026-07-22

## Confirmed Stack

- Monorepo and orchestration: Nx
- Frontend framework: Angular
- Build tooling: Vite
- Unit and component test runner: Vitest
- Angular component/integration testing: Angular Testing Library (+ TestBed where needed)
- E2E: Playwright via Nx

## Frontend Architecture Direction

### State Management

Use:
- Angular Signals
- Lightweight domain services
- Angular resources APIs (including rxResource where it improves async state handling)
- Signal Forms as the default form pattern

Avoid for MVP:
- Heavy global state frameworks unless a clear scaling need appears

Reason:
- Faster iteration, lower boilerplate, strong fit for current MVP scope.

### Offline and Persistence

Use:
- IndexedDB for local persistence
- Offline-first flow for transaction create/edit

Reason:
- Better capacity and reliability than localStorage for structured transaction history.

### API Contract Strategy

Use:
- Shared TypeScript models
- Runtime validation at boundaries (client input and server input)

Reason:
- Better safety than type-only contracts.

## Date and Time Strategy

Current decision:
- Use native Date for MVP
- Centralize all calendar boundaries in one utility layer

Required utility responsibilities:
- Month start/end calculation
- Year start/end calculation
- Local timezone boundary behavior for Poland-focused usage
- Single place to refactor if multi-timezone support is needed later

Policy details:
- Canonical timezone: Europe/Warsaw
- Month/year boundaries are computed in local Europe/Warsaw time
- DST behavior is validated through dedicated utility tests

Why this is safe for now:
- Current product is for a small household use case in one timezone.
- Complexity stays low while test coverage protects edge cases.

## UI Strategy

Use:
- Angular Material for MVP delivery speed and accessibility baseline
- Custom theme tokens for 2-3 color themes

Reason:
- Reduces implementation risk now, while keeping future design-system evolution possible.

## Money Handling Strategy (Current Constraint)

Current decision:
- No external decimal/money library for now
- Use strict number utilities and tests

Policy details:
- Internal representation: JavaScript number
- Display rounding: half-up to 2 decimal places
- API and storage serialization: number values
- Keep raw computed values for intermediate calculations

Mandatory guardrails:
- Keep all arithmetic in dedicated utility functions
- Cover decimal edge values in tests (for example 0.1, 0.2, 100.23)
- Avoid duplicating money logic across components

Note:
- If rounding or precision defects appear, revisit and adopt a decimal library.

## CI Enforcement Level

Current decision:
- Critical flow enforcement is not automatically blocking yet

Expectation:
- AI should still generate tests for critical flows and report gaps explicitly in PR summaries.

## Performance Budget Baseline

Current baseline:
- Initial bundle warning: 500kb
- Initial bundle error: 1mb

PR policy:
- Any change increasing initial bundle by more than 10% requires explicit approval.

## Planned Reassessment Triggers

Revisit these decisions when any of the following happens:
- Multi-user cloud sync is added
- Authentication and server-side conflict resolution are added
- Multi-currency conversion logic becomes more complex
- Multi-timezone usage is required
- UI customization needs exceed Material token theming
