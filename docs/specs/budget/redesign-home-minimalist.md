# Spec: Minimalistyczny redesign widoku Home

## Metadata
- **Date:** 2026-11-09
- **Status:** in-progress
- **Domain:** transaction (Home), app (design tokens)

## Decyzje
- Stylowanie: SCSS + tokeny CSS (bez Tailwinda) — spójność z Angular Material i 4 motywami (w tym ciemnymi).
- Akcent: emerald (`--app-color-accent`, `#059669`; ciemne motywy `#34d399`).
- Limit w hero: budżet ogólny (`BudgetService`), a gdy brak — suma limitów kategorii (`CategoryBudgetService`). Brak limitu = brak paska.

## Acceptance Criteria
- **AC-1** Hero: miesiąc, wydana kwota (duża typografia) i pasek postępu względem limitu; pigułka salda usunięta z toolbaru.
- **AC-2** Siatka kategorii 3-kolumnowa; nazwa zawija się do 2 linii (bez ellipsis w 1 linii).
- **AC-3** Karty kategorii neutralne (jednolite tło, subtelna ramka, cień na hover); kolor kategorii tylko na ikonie i jej kółku.
- **AC-4** Nagłówki sekcji: 1.125rem / 600, bez uppercase, z górnym marginesem.
- **AC-5** Pusty stan transakcji: jasne tło, zaokrąglenie, brak linii przerywanej, ikona SVG paragonu.
- **AC-6** Jeden akcent (emerald) dla FAB i aktywnej pozycji nawigacji; FAB z odstępem 1rem nad dolną nawigacją (z safe-area).

## Implemented in
| AC | Files |
|----|-------|
| AC-1 | `home-screen/home-screen-hero/*`, `ui-transaction/transaction-header-toolbar.component.*`, `header/header.ts` |
| AC-2, AC-3, AC-4 | `categories-quick-add/categories-quick-add.scss` |
| AC-4, AC-5 | `last-transaction/last-transaction.{ts,scss}` |
| AC-6 | `home-screen-income-fab.scss`, `transaction-bottom-nav.component.scss`, `apps/budget-fort/src/styles.scss` |
