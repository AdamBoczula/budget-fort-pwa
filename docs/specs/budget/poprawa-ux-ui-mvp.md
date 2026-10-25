# Spec: Poprawa UX/UI i dokończenie MVP

## Metadata
- **Author:** aboczula
- **Date:** 2026-10-24
- **Status:** draft
- **Domain:** cross-cutting (budget, transaction, app)

## Cel biznesowy

Poprawa użyteczności i spójności wizualnej aplikacji oraz doprowadzenie do stanu "MVP complete":
wszystkie funkcje działają, waluta faktycznie formatuje kwoty, interfejs jest spójny,
quality gate przechodzi na zielono.

---

## Faza 1: 🔧 Quick Wins — lint, build warnings, martwy kod

### 1.1 Naprawić błędy lint (`feature-transaction`)
- **dashboard-screen.ts** — `BudgetState` importowany statycznie z lazy-loaded `feature-budget`
  - Rozwiązanie: przenieść integrację budżetu do osobnego komponentu/ścieżki w `feature-budget`
    albo używać tylko typów przez shared interface (rekomendowane: lazy loading przez DI token)
- **dashboard-screen.spec.ts** — ten sam problem
- **dashboard-state.ts** — usunąć unused `getMonthRange`, `getYearRange`

### 1.2 Naprawić ostrzeżenia lint
- Dodać brakujące return types w 6 funkcjach testowych
- Usunąć unused imports w spec files

### 1.3 Naprawić ostrzeżenia build
- Usunąć `CategoryEditDialogComponent` z imports `SettingsBudgetScreenComponent` (nieużywany)
- Poprawić 5× `attr.aria-label` → `aria-label` w `dashboard-period-selector` i `dashboard-category-detail`
- Usunąć lub zastąpić Nx welcome component

### 1.4 Usunąć martwy kod
- `TransactionBottomSheetComponent` — placeholder "w przygotowaniu", nieużywany
- `UiTransactionComponent` — demo komponent
- `transactions-indexedDb.const.ts` — jeden export, nieużywany

---

## Faza 2: 🏗️ Porządki architektoniczne

### 2.1 Poprawić routing
Stan obecny:
```
/ → /feature-transaction
  ├── /  → HomePageScreen
  ├── /dashboard → DashboardPageScreen  
  ├── /settings → SettingsPageScreen
  └── /settings/budget → SettingsBudgetScreen (lazy loaded)
```

Proponowany:
```
/ → /home
  ├── /home  → HomePageScreen
  ├── /dashboard → DashboardPageScreen
  ├── /budget → SettingsBudgetScreen (lazy loaded) ← własna ścieżka!
  └── /settings → SettingsPageScreen
```

Korzyści: budżet nie jest podsettings, tylko własną sekcją. Krótsze URL-e.

### 2.2 Problem lazy-load boundary (powiązane z 1.1)
`DashboardScreen` w `feature-transaction` importuje `BudgetState` z `feature-budget`,
który jest lazy-loaded. To narusza granicę modułów.

Rozwiązanie: `DashboardScreen` nie powinien bezpośrednio używać `BudgetState`.
Zamiast tego:
- Wydzielić `BudgetProgressSectionComponent` w `feature-budget`,
  który będzie lazy-loaded razem z resztą budżetu
- Dashboard będzie miał slot/outlet na tę sekcję
- Albo: przenieść `BudgetState` do `data-access-budget` (nie łamie lazy-load)

### 2.3 Scalić duplikaty `CategoryEditDialog`
Są dwie implementacje:
- `feature-transaction/category-edit-dialog/` — prostsza (ngModel)
- `feature-budget/category-edit-dialog/` — bogatsza (Reactive Forms, grid kolorów/ikon)

Docelowo: jedna implementacja w `ui-budget` lub `feature-budget`, używana przez obie ścieżki.

### 2.4 Naprawić barrel export `local-db`
`LocalStorageService` używany przez settings components, ale nieeksportowany z `index.ts`.
Dodać do publicznego API.

---

## Faza 3: 💱 Waluta — faktyczne formatowanie

### 3.1 Utworzyć `CurrencyService` w nowym shared lib
```typescript
@Service()
export class CurrencyService {
  private readonly storage = inject(LocalStorageService);
  readonly currentCurrency = signal<CurrencyCode>('PLN');
  // Odczyt z localStorage przy inicjalizacji
  // format(amount: number): string → "1 234,56 zł" / "€1,234.56"
}
```

### 3.2 Podpiąć formatowanie we wszystkich komponentach
Wszystkie miejsca gdzie jest hardcoded `'PLN'` → użyć `CurrencyService.format()`:
- `transaction-form` — wyświetlanie kwot
- `last-transaction-item` — kwota transakcji
- `budget-progress-bar` — "spent / limit"
- `budget-current-month-card` — kwoty
- `budget-previous-month-card` — kwoty
- `budget-category-card` — wydatki z poprzedniego miesiąca
- `dashboard-category-list` — sumy kategorii
- `dashboard-pie-chart` — center text i tooltipy
- `header` (TransactionTopBar) — bilans
- `dashboard-period-selector` — etykiety (jeśli dotyczy)

### 3.3 Dodać formaty dla wszystkich walut
| Waluta | Format | Separator tysięcy | Separator dziesiętny | Sufiks/Prefiks |
|--------|--------|-------------------|---------------------|-----------------|
| PLN | `1 234,56 zł` | spacja | `,` | `zł` suffix |
| EUR | `€1,234.56` | `,` | `.` | `€` prefix |
| GBP | `£1,234.56` | `,` | `.` | `£` prefix |
| UAH | `1 234,56 ₴` | spacja | `,` | `₴` suffix |

---

## Faza 4: 🎨 Poprawa UI/UX

### 4.1 Home Screen — dodać mini-widżet budżetu
Obecnie home screen: tylko quick-add kategorii + ostatnie transakcje.
Dodać u góry zwięzły pasek progresu budżetu ogólnego (klikalny → `/budget`):
```
┌──────────────────────────────────────────┐
│ Budżet: ████████░░ 1 200 / 5 000 zł (24%) → │
└──────────────────────────────────────────┘
```

### 4.2 Ujednolicić template'y
Niektóre komponenty używają `templateUrl` zamiast inline `template`, 
wbrew standardowi z `02-agent-operating-model.md`. Do poprawy:
- `HomePageScreen` → inline template
- `CategoriesQuickAddComponent` → inline template  
- `TransactionFormComponent` → inline template
- `LastTransactionItemComponent` → inline template (>60 linii → rozważyć dekompozycję)
- `SettingsPageScreen` → inline template
- `SettingsCategoriesSectionComponent` → inline template
- `SettingsThemeSelectorComponent` → inline template
- `SettingsCurrencySelectorComponent` → inline template

### 4.3 Poprawić layout dashboardu
- Lepszy spacing między sekcjami (budget → pie chart → category list)
- Dodać nagłówki sekcji ("Budżet miesięczny", "Wydatki wg kategorii")

### 4.4 Menu nawigacyjne — poprawki
- Zmienić kolejność: Transakcje, **Budżet**, Ustawienia (budżet ważniejszy niż ustawienia)
- Dodać ikonę do "Planowanie budżetu"
- Aktywny route podświetlony kolorem primary

### 4.5 Poprawki dostępności (a11y)
- Poprawić `attr.aria-label` → `aria-label` (już w Fazie 1)
- Dodać `aria-label` do przycisków bez tekstu (ikon)
- Sprawdzić kontrast kolorów (szczególnie progress bar kolory vs tło)
- Upewnić się, że focus trap działa w dialogach

### 4.6 Responsywność
- Sprawdzić home screen na mobile (< 400px) — kategorie quick-add mogą być za małe
- Dashboard na tablecie vs desktop
- Ustawienia budżetu na małych ekranach

---

## Faza 5: ✅ Testy + Quality Gate

### 5.1 Uzupełnić testy z `planowanie-budzetu.md`
Z task board:
- Task 8: Testy jednostkowe BudgetService, BudgetState, money-utils
- Task 9: Testy komponentowe BudgetProgressBar, SettingsBudgetScreen (już istnieją → zweryfikować)
- Task 10: Testy E2E (już istnieje `budget.spec.ts` → zweryfikować pokrycie AC)

### 5.2 Uzupełnić testy z `przeglad-historii-budzetu.md`
Z task board:
- Task 6: Testy jednostkowe BudgetAggregationService dla różnych okresów
- Task 7: Testy komponentowe TransactionNavigationDrawerComponent
- Task 8: Testy komponentowe SettingsBudgetScreenComponent (tryb historii)
- Task 9: Testy E2E (już istnieje `budget-history.spec.ts` → zweryfikować)

### 5.3 Naprawić istniejące testy
- `budget-fort` — 1 test fail (pre-existing, sprawdzić)
- Usunąć static import `feature-budget` z `dashboard-screen.spec.ts` (Faza 1)

### 5.4 Quality gate
```bash
npx nx affected -t lint test build e2e
```
Wynik: wszystkie targety ✅

---

## Architektura docelowa

```
libs/
├── shared/
│   └── local-db/          # IndexedDB + LocalStorageService
├── budget/
│   ├── data-access-budget/  # BudgetService, CategoryBudgetService, TYPY
│   ├── ui-budget/           # BudgetProgressBar, PeriodSelector (współdzielony)
│   └── feature-budget/      # BudgetState, SettingsBudgetScreen, BudgetProgressSection
├── transaction/
│   ├── data-access-transaction/  # TransactionService, CategoryService, SubcategoryService
│   ├── ui-transaction/           # HeaderToolbar, NavigationDrawer, TransactionItem
│   └── feature-transaction/      # Shell, HomeScreen, DashboardScreen (bez budżetu!)
└── shared/
    └── currency/            # NOWY: CurrencyService + formaty
```

### Routing docelowy
```
/ → /home
  ├── /home       → HomePageScreen (z mini-widżetem budżetu)
  ├── /dashboard  → DashboardPageScreen (wydatki: pie chart + category list)
  ├── /budget     → SettingsBudgetScreen (lazy, z własnym BudgetProgressSection)
  └── /settings   → SettingsPageScreen
```

### Kluczowa zmiana: DashboardScreen nie importuje BudgetState
Dashboard pokazuje tylko wydatki (pie chart + category list) — **bez** pasków budżetu.
Paski budżetu są na ekranie `/budget` i jako mini-widżet na home screenie.
To rozwiązuje problem lazy-load boundary.

---

## Task Board

| # | Faza | Task | Priorytet |
|---|------|------|-----------|
| 1 | 1 | Naprawić błąd: static import lazy-loaded lib w dashboard-screen | 🔴 |
| 2 | 1 | Naprawić unused imports i return types (12 warnings) | 🟡 |
| 3 | 1 | Poprawić `attr.aria-label` → `aria-label` (5 miejsc) | 🟡 |
| 4 | 1 | Usunąć martwy kod (BottomSheet, UiTransaction, indexedDb.const) | 🟡 |
| 5 | 2 | Poprawić routing (/home, /dashboard, /budget, /settings) | 🔴 |
| 6 | 2 | Rozwiązać lazy-load boundary (DashboardScreen bez BudgetState) | 🔴 |
| 7 | 2 | Scalić CategoryEditDialog | 🟡 |
| 8 | 2 | Naprawić barrel export local-db | 🟡 |
| 9 | 3 | Utworzyć CurrencyService w shared lib | 🔴 |
| 10 | 3 | Podpiąć formatowanie waluty we wszystkich komponentach | 🔴 |
| 11 | 4 | Dodać mini-widżet budżetu na home screen | 🟢 |
| 12 | 4 | Ujednolicić template'y (inline) | 🟢 |
| 13 | 4 | Poprawić layout dashboardu | 🟢 |
| 14 | 4 | Poprawki w menu nawigacyjnym | 🟢 |
| 15 | 4 | Poprawki a11y | 🟢 |
| 16 | 5 | Uzupełnić/naprawić testy | 🔴 |
| 17 | 5 | Quality gate: nx affected -t lint test build e2e ✅ | 🔴 |

---

## Otwarte pytania

- ❓ **Dashboard bez budżetu** — czy na dashboardzie (wydatki) usunąć całkowicie paski budżetu,
  zostawiając tylko pie chart + category list? Czy może zostawić tam też mini-pasek?
  (rekomendacja: usunąć, żeby rozwiązać lazy-load boundary; budżet ma własny ekran)

- ❓ **Currency lib** — osobny `libs/shared/currency` czy dodać do istniejącego `local-db`?
  (rekomendacja: osobny `libs/shared/currency`, bo to inna odpowiedzialność)

- ❓ **Kolejność menu** — Transakcje → Budżet → Ustawienia, czy Budżet → Transakcje → Ustawienia?
  (rekomendacja: Transakcje → Budżet → Ustawienia, bo transakcje są najczęściej używane)