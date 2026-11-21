# SDLC Routing Matrix & Role Tiers

## 1. Capability Tiers (IDE-Agnostic)

| Tier           | Purpose                                                     | Roles                                                                                                                                                                              |
| -------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **reasoning**  | Deep architectural trade-offs, Nx boundaries, Dexie schemas | `architect`                                                                                                                                                                        |
| **multimodal** | Screen states, ergonomics, visual layout, Anti-UI-Slop      | `ui-ux-designer`                                                                                                                                                                   |
| **fast**       | Routing, specs, TDD coding, E2E, review, security, QA       | `sdlc-orchestrator`, `business-analyst`, `senior-frontend-dev`, `automation-playwright-tester`, `code-reviewer`, `security-data-guard`, `qa-coordinator`, `devops-release-monitor` |

Full role prompts live in `.agents/agents/<role>.md`.

## 2. Dynamic Agent Chains

| Task Type          | Examples                                               | Sequence                                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **New Feature**    | Category spending limits, yearly report                | `business-analyst` -> `ui-ux-designer` _(if UI)_ -> `architect` _(if structural/data)_ -> **User Approval Gate** -> `automation-playwright-tester` + `senior-frontend-dev` -> `code-reviewer` -> `qa-coordinator` -> `devops-release-monitor` |
| **Bugfix**         | Mobile save button broken, rounding discrepancy        | `business-analyst` _(repro & AC)_ -> **User Approval Gate** -> `senior-frontend-dev` _(regression TDD + fix)_ -> `code-reviewer` -> `qa-coordinator`                                                                                          |
| **Improvement**    | Contrast polish, dialog animation, UX tweak            | `ui-ux-designer` -> **User Approval Gate** -> `senior-frontend-dev` -> `code-reviewer` -> `qa-coordinator` _(screenshots)_                                                                                                                    |
| **Technical Task** | Dexie DB migration, Nx/Angular upgrade, CI/CD refactor | `architect` _(if data/Nx)_ -> **User Approval Gate** -> `senior-frontend-dev` -> `security-data-guard` -> `code-reviewer` -> `qa-coordinator` -> `devops-release-monitor`                                                                     |

## 3. Approval Gates, Hub-and-Spoke & Retry Limits

- **Governance Gate (Mandatory)**: Agents may update documentation, `docs/specs/`, and `docs/adr/` without approval, but **must obtain explicit user approval** before modifying source code or tests (unit, component, E2E).
- **No In-Place Execution of Higher-Tier Roles**: An orchestrator operating in the `fast` tier must never execute `reasoning` (`architect`) or `multimodal` (`ui-ux-designer`) work in-place in the main thread — always delegate those roles to their assigned tier.
- **Hub-and-Spoke (No Nested Spawning)**: Delegated roles do not spawn other subagents; they return questions or `BLOCKED` status to the orchestrator, which relays context to the appropriate role or escalates to the user.
- **Review Loop**: If `code-reviewer` requests changes, route findings back to `senior-frontend-dev`. For architectural or UX ambiguity, consult `architect` or `ui-ux-designer`.
- **QA Triage**: If `qa-coordinator` detects a failing gate or visual/a11y regression, route only the failing output/evidence to the responsible role (`senior-frontend-dev`, `automation-playwright-tester`, `architect`, or `ui-ux-designer`).
- **Retry Limits**:
  - Technical timeout / empty output: max `1` retry
  - Test-fix loop (`senior-frontend-dev`, `automation-playwright-tester`): max `3` attempts -> escalate to `architect` / user
  - Review loop (`code-reviewer` <-> `senior-frontend-dev`): max `2` cycles
  - QA re-check (`qa-coordinator`): max `1` re-check after fix
