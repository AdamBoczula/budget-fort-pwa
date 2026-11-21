---
name: sdlc-orchestrator
description: >-
  Orchestrates the Spec-Driven Development (SDD) multi-agent workflow for Budget Fort.
  Classifies incoming requests (New Feature, Bugfix, Improvement, Technical Task),
  selects the minimal agent chain from .agents/agents/, enforces approval gates and
  SDD traceability, and routes quality-gate failures. USE WHEN receiving feature
  requests, bugfixes, UI/UX improvements, architectural questions, or technical tasks.
---

# SDLC Orchestrator

Coordinate work across the specialized roles in `.agents/agents/` following the
operating model in `.agents/context/02-agent-operating-model.md` and the SDD
workflow in `docs/specs/01-spec-workflow.md`.

This skill is **IDE-agnostic**: delegate roles using whatever subagent, handoff, or
role-switching mechanism your host environment provides, mapping each role to its
capability tier (`fast`, `reasoning`, `multimodal`) rather than a hardcoded model.

## Quick Workflow

1. **Classify the request** as one of: `New Feature`, `Bugfix`, `Improvement`, or `Technical Task`.
2. **Load the routing plan** from [references/routing-matrix.md](references/routing-matrix.md) and announce the selected sequence.
3. **Relay context cleanly** between roles using [assets/handoff-template.md](assets/handoff-template.md).
4. **Enforce Approval Gate**: stop and request user approval before changing source code or tests (documentation, specs in `docs/specs/`, and ADRs in `docs/adr/` do not require approval).
5. **Run verification** per [references/quality-gates.md](references/quality-gates.md) before marking work complete.

## References & Assets

- [references/routing-matrix.md](references/routing-matrix.md) — Task classification, role-to-tier allocation, approval gates, and feedback loops.
- [references/quality-gates.md](references/quality-gates.md) — Authoritative verification commands, secrets scan, and SDD traceability checks.
- [assets/handoff-template.md](assets/handoff-template.md) — Structured handoff template for passing specs, decisions, and test failures between roles.
