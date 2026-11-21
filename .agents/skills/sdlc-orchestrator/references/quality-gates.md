# Quality Gates & Traceability Checks

Before marking any implementation task complete, verify all gates defined in
`.agents/context/03-testing-quality-gates.md` and `AGENTS.md`:

## 1. Pre-PR Verification Suite

```bash
# 1. Format check (covers code, markdown docs, json, yml)
npx nx format:check --base=origin/main

# 2. Workspace lint & SCSS lint
npx nx run-many -t lint
npm run lint:css

# 3. Affected tests, build, and E2E
npm exec nx affected -t test build e2e
```

## 2. Security & Secrets Audit

Run the repository secrets scanner when touching config, CI, Firebase, or env files:

```bash
bash scripts/scan-secrets.sh
```

## 3. SDD Traceability Checklist

- New source files start with `// spec: docs/specs/<domain>/<name>.md`
- New/updated tests annotate covered acceptance criteria: `// covers: docs/specs/<domain>/<name>.md#AC-N`
- The spec's `Implemented in` table is updated continuously during implementation
- All documentation, spec, and file names are in **English only**
