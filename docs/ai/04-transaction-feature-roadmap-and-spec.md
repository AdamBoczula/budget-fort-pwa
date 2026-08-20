# Transaction Feature Roadmap And Specification

Last updated: 2026-07-23

## Product Goal

Build a mobile, fast, and easy-to-use home-budget module as a PWA, where the user:
- adds an expense in 1-3 clicks,
- sees recent transactions and can edit them,
- navigates to expense analytics (week/month/year, category filters).

## Scope Of The Current Initiative

Current focus:
- Home Transactions screen as a container screen.
- Component communication through a state facade.
- Local persistence via IndexedDB (data-access layer).
- Shell loading instead of hard navigation blocking with a resolver.

Out of current focus (next phase):
- Analytics dashboard with category filters and time aggregations.

## UX Vision (Home Transactions)

Screen layout:
1. Clean header
   - menu icon,
   - current month (e.g., JULY),
   - balance (e.g., +2000 zł).

2. Quick add
   - category grid (e.g., 4 columns),
   - icon above the category label,
   - separate "Other" category.

3. Recent transactions
   - grouping by day (Today, Yesterday, date),
   - transaction item: category icon, name, amount,
   - interactions: swipe or click for edit/delete.

## Functional Specification

### Screens and responsibilities

1. Home Screen (container)
   - orchestrates data loading,
   - fetches state from the facade,
   - passes data and events down to UI components,
   - contains no persistence logic.

2. UI Components (presentational)
   - Header: renders the month and balance,
   - Categories Quick Add: renders the grid and emits a selection event,
   - Last Transactions: renders the daily sections and emits edit/delete events.

3. State facade
   - single place for the screen's business logic,
   - controls loading/error/initialized,
   - maps data to a view model for the UI.

4. Data access
   - the single place that contacts IndexedDB,
   - CRUD operations without presentation logic.

### User flows

1. Entering the screen
   - start shell UI,
   - load transactions from the local database,
   - render the transaction section after loading completes.

2. Quick add
   - user selects a category,
   - the form opens (bottom sheet) with the selected category pre-filled,
   - save the transaction and refresh the state.

3. Edit transaction
   - enter from the recent transactions list,
   - modify and save,
   - update the list and daily groups.

4. Delete transaction
   - action available from the list (swipe/menu),
   - delete the record,
   - refresh the state and recalculations.

## Technical Specification

### State architecture

Preferred model for MVP:
- Signals: source of truth for UI state (transactions, loading, error, computed).
- async/await: for simple, one-time command actions (load/add/edit/delete).
- RxJS: stays in data-access, especially for stream extensions.

Rationale:
- readable and simple implementation,
- easy debugging,
- ready for later extension with more reactive scenarios.

### RxResource

Educational and target role:
- use it consciously where it genuinely helps describe a resource lifecycle,
- do not treat it as the only persistent application state mechanism,
- at this stage it can be added piloted to a specific UI section to learn the API.

### Loading strategy

MVP decision:
- shell/skeleton on the screen instead of global resolver-blocking.

Why:
- better perceived performance,
- lower chance of a "dead" screen on a slower local read,
- more mobile-friendly UX.

### Transaction data model

Required fields:
- id,
- amount,
- date,
- categoryId,
- accountId,
- optional comment.

Presentation rules:
- grouping by day,
- Today and Yesterday labels,
- fall back to the full local date.

## Roadmap

### Phase 1: Home MVP Foundation

Scope:
- finish the state facade,
- connect the Home Screen to state,
- render quick add and last transactions,
- loading shell and error handling.

Acceptance criteria:
- the user sees data on startup,
- can add and edit a transaction,
- UI refreshes without a full screen reload.

### Phase 2: Transaction Interactions

Scope:
- delete transactions,
- polish swipe/click actions,
- finish the flow.

Acceptance criteria:
- full local CRUD of transactions works,
- consistent list and daily-group behavior after every action.

### Phase 3: Quality And Reliability

Scope:
- unit tests for the facade,
- component tests for flows,
- offline and regression scenarios.

Acceptance criteria:
- stable tests for critical flows,
- no regressions on add/edit/delete.

### Phase 4: Dashboard Analytics Screen

Scope:
- new dashboard screen,
- weekly/monthly/yearly aggregations,
- category filters.

Acceptance criteria:
- user can analyze expenses over time,
- filtering and aggregations are correct and readable.

## Risks And Weak Points

1. Facade overload
   - the risk of combining many responsibilities in one class.

   Mitigation:
   - keep strict separation: data-access IO, facade logic, UI presentation.

2. Premature complexity
   - the risk of increased complexity without real need.

   Mitigation:
   - start with simple async/await carriers,
   - add RxJS where multi-value emissions or cancel/retry are needed.

3. Ambiguous list action UX
   - the risk of inconsistent swipe vs. click interactions.

   Mitigation:
   - define an explicit interaction contract for the list component.

## Open Product Questions

1. Does quick add save immediately or always open a form?
2. What is the limit of the recent transactions section?
3. Should edit/delete be triggered both by swipe and click?
4. How exactly do we calculate the header balance?
5. Is explicit confirmation required when deleting?

## The Home Transactions Feature Is Done

To consider the feature complete:
- the screen renders the header, quick add and the recent transactions list,
- data loads from IndexedDB,
- loading and errors are handled in the UI,
- add/edit/delete are available,
- critical scenario tests pass.
