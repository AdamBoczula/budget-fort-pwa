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
5. Run verification command and summarize results.
6. Update docs if behavior or decisions changed.

## Architecture Guard Rules

- Respect existing Nx boundaries and tags.
- Do not bypass module boundaries for quick fixes.
- Prefer changes in the closest domain library instead of app-level duplication.
- Keep transaction domain logic cohesive across data, feature, and ui libraries.

## Coding Standards Baseline

Agents should enforce these defaults unless a task explicitly requires deviation:
- Use domain-first folder placement for business logic.
- Keep money and date logic in pure utility functions.
- Use explicit return types on exported functions.
- Do not introduce any in new code.
- Apply fail-fast input validation at domain and API boundaries.

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
