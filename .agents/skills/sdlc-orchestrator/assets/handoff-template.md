# Role Handoff Template

Use this structure when handing off work to the next role in the SDLC chain:

```markdown
## Handoff: <From Role> -> <To Role>

- **Task Type:** New Feature | Bugfix | Improvement | Technical Task
- **Spec / ADR:** docs/specs/<domain>/<name>.md (or N/A)
- **Scope:** <Concise summary of what this role owns and what "done" looks like>
- **Inputs / Artifacts:**
  - <File paths, AC numbers, wireframes, or failing test output>
- **Constraints:**
  - Respect Nx boundaries; keep money/date logic in pure utilities (Europe/Warsaw)
  - Offline-first IndexedDB flows must remain tested
- **Expected Deliverable:** <Spec draft | ADR | Plan | Code + TDD tests | Review | QA report>
```
