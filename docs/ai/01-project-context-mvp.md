# Project Context (MVP)

Last updated: 2026-07-22

## Product Intent

Budget Fort is a home-budget PWA focused on helping users track spending by category.

## MVP Scope

In scope:
- Add transactions for categories
- Edit existing transactions
- Show monthly category spend summaries
- Show yearly category spend summaries
- Currency change support
- Theme switch support (2-3 themes)

Planned after MVP:
- Cloud connectivity
- Authentication
- Repeated transactions (subscriptions and recurring payments)

## Critical Business Flows

These flows are mandatory to protect with tests:
1. Add transaction to category
2. Edit existing transaction
3. Monthly category summary calculation
4. Offline add/edit workflow with local persistence behavior

## High-Risk Areas

Treat these as high-risk during implementation and review:
- Money calculations
- Offline/PWA behavior

## Money and Time Assumptions (Current)

Known assumptions from stakeholder input:
- Decimal money values are required (example: 100.23)
- Locale examples are Poland-centric
- Date/time examples indicate Poland timezone usage
- MVP date handling uses native Date with centralized month/year boundary utilities
- Canonical reporting timezone is Europe/Warsaw

Important:
- No external money library is used for MVP; arithmetic must be centralized in utility functions.
- Internal representation uses JavaScript number values.
- Round half-up to 2 decimal places for display values.
- Keep raw computed values for intermediate calculations and aggregate logic.

## Source Of Truth

Current source of truth is repository documentation and files in this codebase.

## Near-Term Product Success Signals

Quality goals currently emphasized:
- Strong component test coverage using Angular Testing Library
- Unit test coverage for dumb components, services, and TypeScript logic
- Reliable test coverage for critical business cases
