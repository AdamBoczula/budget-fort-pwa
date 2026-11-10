---
name: conventional-commit
description: Generates Conventional Commits formatted commit messages for Budget Fort. Analyzes staged changes and produces properly formatted commit descriptions. USE WHEN generating or suggesting git commit messages.
---

# Conventional Commit Generator

Generates conventional commit messages adhering to the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

## Workflow

1. Check modified files: `git status`
2. Inspect the diff: `git diff` or `git diff --cached`
3. Structure the commit message following the format below
4. Provide a ready-to-run `git commit -m "..."` command to the user

## Message Structure

```
<type>(<scope>): <description>

[body]

[footer]
```

### Commit Types

| Type | Description |
|------|-------------|
| `feat` | New user-facing feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, whitespace, no logic changes |
| `refactor` | Refactoring code without behavior change |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system, packaging, bundler |
| `ci` | CI/CD pipeline changes |
| `chore` | Maintenance, dependencies, chores |
| `revert` | Reverting a previous commit |

### Monorepo Scopes

Use scopes aligned with Budget Fort monorepo domains:
- `transaction` — for `libs/transaction/**`
- `budget` — for `libs/budget/**`
- `shared` — for `libs/shared/**`
- `app` — for `apps/budget-fort/**`
- `e2e` — for `apps/budget-fort-e2e/**`
- `nx` — workspace / Nx configuration changes
- `deps` — dependency updates

### Examples

```bash
feat(transaction): add quick-add transaction form with category autocomplete
fix(budget): correct monthly aggregation for leap years
refactor(shared): extract money formatting to money-utils.ts
test(transaction): add unit tests for TransactionState service
chore(deps): update Angular to 22.0.6
docs: update AGENTS.md with new skill references
```

### Rules & Validation

- **type:** Must be one of the recognized types above.
- **scope:** Recommended for monorepo clarity.
- **description:** Mandatory. Imperative mood, present tense ("add", not "added" or "adds"). Lowercase, no trailing period.
- **body:** Optional. Explains the "why" and trade-offs.
- **footer:** Optional. Mentions breaking changes (`BREAKING CHANGE:`) or issue references.

## Output

After analyzing the diff, output the suggested command:

```bash
git commit -m "<type>(<scope>): <description>"
```

Do not execute the commit automatically — propose it for user execution or approval.
