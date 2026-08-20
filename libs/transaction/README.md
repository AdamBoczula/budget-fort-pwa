# transaction

Parent project for the **transaction domain** in Budget Fort.

This project is a container that groups the transaction-domain libraries:

| Library | Alias | Purpose |
| ------- | ----- | ------- |
| `feature-transaction` | `@feature-transaction` | Transaction feature (Home screen, quick add, last transactions, state facade) |
| `data-access-transaction` | `@data-access-transaction` | Transaction data access (IndexedDB CRUD via Dexie) |
| `ui-transaction` | `@ui-transaction` | Reusable transaction UI components |

## Boundaries

- Tag: `type:feature`
- May depend on `type:feature`, `type:data`, `type:ui` libraries.
- Must not depend on the app (`type:app`).

## Running unit tests

Run `nx test transaction` to execute the unit tests.

## See also

- `docs/ai/06-repository-architecture.md` — where to put new code.
- `docs/ai/04-transaction-feature-roadmap-and-spec.md` — feature specification and roadmap.
