# Spec: Przegląd historii budżetu i przebudowa menu

## Metadata
- **Author:** aboczula
- **Date:** 2026-10-20
- **Status:** implemented
- **Domain:** budget

## Cel biznesowy

Użytkownik może przeglądać wydatki z poprzednich miesięcy/lat na ekranie budżetu (tylko odczyt) oraz korzystać z przebudowanego menu nawigacyjnego z grupowanymi podpunktami (expandable submenu).

## Zakres (Scope)

### W scope
- **Przebudowa menu** z płaskiej listy na grupowane submenu (expandable):
  - **Transakcje**: Dodaj nowe (otwiera dialog formularza transakcji, zamyka drawer), Dashboard (Panel główny)
  - **Budżet**: Dodaj nowy (link do `/settings/budget`), Dashboard (obecny `/dashboard`)
  - **Ustawienia**: Strona ustawień (theme, waluta, kategorie)
- **Selektor okresu na ekranie budżetu** — reużycie `DashboardPeriodSelectorComponent` (miesiąc/rok, strzałki ◀ ▶, datepicker)
- **Historyczny podgląd budżetu (tylko odczyt):**
  - Dla bieżącego miesiąca: pełna funkcjonalność (karta bieżącego miesiąca, porównanie z poprzednim, limity kategorii z możliwością edycji) — tak jak teraz
  - Dla przeszłych miesięcy: tylko podgląd wydatków w wybranym okresie + porównanie z miesiącem wcześniejszym. **Bez sekcji limitów kategorii** (ukryta). **Bez możliwości edycji.**
  - Dla przyszłych miesięcy: zablokowane (nie można wybrać)
- **Widok roku:** analogicznie — podsumowanie roczne wydatków

### Out of scope
- Wersjonowanie historycznych limitów kategorii (przechowywanie snapshotów)
- Edycja limitów/budżetu dla przeszłych okresów
- Wykresy trendów (wydatki vs budżet na przestrzeni miesięcy)
- Nowe endpointy API (MVP nie ma backendu)
- Zmiana sposobu działania dashboardu (transakcyjnego) — ten pozostaje bez zmian

## Use Cases (UC)

### UC-1: Przeglądanie historycznego miesiąca na ekranie budżetu

- **Aktor:** Użytkownik
- **Precondition:** Użytkownik jest na ekranie budżetu (`/settings/budget`). Istnieją transakcje w poprzednich miesiącach.
- **Main flow:**
  1. Użytkownik widzi selektor okresu (miesiąc/rok) u góry ekranu budżetu
  2. Domyślnie wybrany jest bieżący miesiąc — widok edycyjny (taki jak teraz)
  3. Użytkownik klika strzałkę "◀" (poprzedni okres)
  4. System przełącza widok na poprzedni miesiąc
  5. System pokazuje:
     - Kartę "bieżącego miesiąca" (wydatki w wybranym miesiącu)
     - Porównanie z miesiącem wcześniejszym (o ile dane istnieją)
     - **Ukrywa** sekcję "Limity kategorii" i przycisk "Zapisz"
  6. Użytkownik widzi tylko odczyt — nie może edytować limitów
- **Postcondition:** Użytkownik widzi historyczne dane budżetowe dla wybranego miesiąca. Po powrocie do bieżącego miesiąca — widok edycyjny wraca.

### UC-2: Przeglądanie historycznego roku na ekranie budżetu

- **Aktor:** Użytkownik
- **Precondition:** Użytkownik jest na ekranie budżetu. Istnieją transakcje w poprzednich latach.
- **Main flow:**
  1. Użytkownik przełącza tryb na "Rok"
  2. System pokazuje wydatki w wybranym roku (tylko odczyt)
  3. Użytkownik może nawigować po latach (◀ ▶) w zakresie dostępnych danych
  4. Nie może wybrać przyszłego roku
- **Postcondition:** Użytkownik widzi podsumowanie roczne.

### UC-3: Nawigacja w nowym menu — Transakcje

- **Aktor:** Użytkownik
- **Precondition:** Użytkownik otwiera drawer nawigacyjny.
- **Main flow:**
  1. Użytkownik widzi grupę "Transakcje" (zwiniętą lub rozwiniętą)
  2. Użytkownik klika "Transakcje" → grupa rozwija się pokazując podpunkty
  3. Użytkownik klika "Dodaj nowe"
  4. Drawer zamyka się
  5. Otwiera się dialog `TransactionFormComponent` (taki sam jak przy FAB na home screenie)
  6. Po zapisaniu/anulowaniu transakcji — dialog się zamyka
- **Postcondition:** Transakcja dodana (jeśli użytkownik zapisał) lub anulowana.

### UC-4: Nawigacja w nowym menu — Budżet

- **Aktor:** Użytkownik
- **Precondition:** Użytkownik otwiera drawer nawigacyjny.
- **Main flow:**
  1. Użytkownik klika grupę "Budżet" → rozwija podpunkty
  2. "Dodaj nowy" → nawiguje do `/settings/budget` (ustawienia budżetu)
  3. "Dashboard" → nawiguje do `/dashboard` (panel główny z wykresami)
- **Postcondition:** Użytkownik jest na wybranym ekranie.

### UC-5: Nawigacja w nowym menu — Ustawienia

- **Aktor:** Użytkownik
- **Precondition:** Użytkownik otwiera drawer nawigacyjny.
- **Main flow:**
  1. Użytkownik klika grupę "Ustawienia" → rozwija podpunkty
  2. Jedyny podpunkt: "Ustawienia" → nawiguje do `/settings` (theme, waluta, kategorie)
- **Postcondition:** Użytkownik jest na stronie ustawień.

### UC-6: Powrót do bieżącego miesiąca

- **Aktor:** Użytkownik
- **Precondition:** Użytkownik przegląda historyczny miesiąc na ekranie budżetu (tryb tylko odczyt).
- **Main flow:**
  1. Użytkownik klika "Dzisiaj" / "Bieżący miesiąc" (lub nawiguje strzałkami do bieżącego)
  2. System przywraca pełny widok edycyjny: limity kategorii, przycisk "Zapisz", kopiowanie z poprzedniego miesiąca
- **Postcondition:** Widok edycyjny przywrócony. Użytkownik może edytować limity.

## Edge Cases

- **Edge Case 1:** Brak transakcji w wybranym historycznym miesiącu
  - **Oczekiwane zachowanie:** Karta pokazuje "0 zł" wydatków. Porównanie z poprzednim miesiącem pokazuje null lub 0.

- **Edge Case 2:** Użytkownik próbuje przejść do przyszłego miesiąca
  - **Oczekiwane zachowanie:** Strzałka "▶" jest zablokowana (disabled), tak samo jak w `DashboardState.canGoNext()`.

- **Edge Case 3:** Brak danych do porównania (np. brak transakcji w miesiącu wcześniejszym)
  - **Oczekiwane zachowanie:** Karta "Poprzedni miesiąc" nie wyświetla się lub pokazuje "Brak danych".

- **Edge Case 4:** Użytkownik otwiera "Dodaj nowe" z menu, ale nie ma jeszcze żadnych kategorii
  - **Oczekiwane zachowanie:** Dialog formularza transakcji otwiera się normalnie — kategorie są inicjalizowane przez `categoryInitializerResolver`.

- **Edge Case 5:** Zmiana miesiąca na ekranie budżetu gdy dane są w trakcie ładowania
  - **Oczekiwane zachowanie:** Pokazujemy loader/skeleton podczas przełączania okresu.

- **Edge Case 6:** Menu w trybie zwiniętym — tylko jedna grupa rozwinięta na raz (accordion)
  - **Oczekiwane zachowanie:** Rozwinięcie nowej grupy zwija poprzednią (accordion behavior). Tylko jedna grupa otwarta na raz.

- **Edge Case 7:** Użytkownik na ekranie budżetu wybiera rok zamiast miesiąca
  - **Oczekiwane zachowanie:** Karta "bieżącego miesiąca" zmienia się na podsumowanie roczne. Sekcja limitów kategorii jest ukryta (limity są miesięczne, bez sensu dla roku). Porównanie rok-do-roku (poprzedni rok).

## Acceptance Criteria (AC)

### AC-1: Wyświetlenie selektora okresu na ekranie budżetu
- **Given:** Użytkownik jest na ekranie `/settings/budget`
- **When:** Strona się ładuje
- **Then:** U góry ekranu widoczny jest selektor okresu (miesiąc/rok) ze strzałkami nawigacyjnymi, domyślnie ustawiony na bieżący miesiąc.

### AC-2: Przełączenie na poprzedni miesiąc — tylko odczyt
- **Given:** Użytkownik jest na ekranie budżetu, istnieją transakcje w poprzednim miesiącu
- **When:** Użytkownik klika strzałkę "◀"
- **Then:** 
  - Karta pokazuje wydatki z poprzedniego miesiąca
  - Porównanie z jeszcze wcześniejszym miesiącem jest widoczne (o ile dane istnieją)
  - Sekcja "Limity kategorii" jest ukryta
  - Przycisk "Zapisz" jest ukryty
  - Przycisk "Kopiuj limity z poprzedniego miesiąca" jest ukryty

### AC-3: Powrót do bieżącego miesiąca — przywrócenie edycji
- **Given:** Użytkownik przegląda historyczny miesiąc (tryb tylko odczyt)
- **When:** Użytkownik nawiguje z powrotem do bieżącego miesiąca
- **Then:** 
  - Sekcja "Limity kategorii" jest widoczna
  - Przycisk "Zapisz" jest widoczny
  - Przycisk "Kopiuj limity z poprzedniego miesiąca" jest widoczny
  - Pola limitów są edytowalne

### AC-4: Nowe menu — grupa Transakcje
- **Given:** Użytkownik otwiera drawer nawigacyjny
- **When:** Użytkownik klika grupę "Transakcje"
- **Then:** Grupa rozwija się pokazując: "Dodaj nowe" i "Dashboard"

### AC-5: Nowe menu — Dodaj nowe otwiera dialog
- **Given:** Drawer nawigacyjny jest otwarty, grupa "Transakcje" rozwinięta
- **When:** Użytkownik klika "Dodaj nowe"
- **Then:** 
  - Drawer zamyka się
  - Otwiera się dialog formularza transakcji (`TransactionFormComponent`)
  - Użytkownik może dodać transakcję

### AC-6: Nowe menu — Budżet
- **Given:** Użytkownik otwiera drawer nawigacyjny
- **When:** Użytkownik klika grupę "Budżet"
- **Then:** Grupa rozwija się pokazując: "Dodaj nowy" (link do `/settings/budget`) i "Dashboard" (link do `/dashboard`)

### AC-7: Nowe menu — Ustawienia
- **Given:** Użytkownik otwiera drawer nawigacyjny
- **When:** Użytkownik klika grupę "Ustawienia"
- **Then:** Grupa rozwija się pokazując: "Ustawienia" (link do `/settings`)

### AC-8: Nowe menu — accordion (tylko jedna grupa otwarta)
- **Given:** Użytkownik ma rozwiniętą grupę "Transakcje"
- **When:** Użytkownik klika grupę "Budżet"
- **Then:** Grupa "Transakcje" zwija się, grupa "Budżet" rozwija się

### AC-9: Przyszłe miesiące zablokowane
- **Given:** Użytkownik jest na ekranie budżetu, wybrany jest bieżący miesiąc
- **When:** Użytkownik próbuje kliknąć strzałkę "▶"
- **Then:** Strzałka jest disabled — nie można przejść do przyszłego miesiąca

### AC-10: Tryb roku na ekranie budżetu
- **Given:** Użytkownik ma transakcje w poprzednim roku
- **When:** Użytkownik przełącza tryb na "Rok" i nawiguje do poprzedniego roku
- **Then:** Wyświetla się podsumowanie roczne wydatków (tylko odczyt), sekcja limitów kategorii ukryta

### AC-11: Widok roku — porównanie rok-do-roku
- **Given:** Wybrany rok to 2025, istnieją wydatki w 2025 i 2024
- **When:** Użytkownik przegląda rok 2025 na ekranie budżetu
- **Then:** Widoczna jest karta z wydatkami 2025 + porównanie z 2024 (różnica kwotowa i procentowa)

### AC-12: Dane przetrwają odświeżenie strony
- **Given:** Użytkownik jest na ekranie budżetu, przegląda poprzedni miesiąc
- **When:** Użytkownik odświeża stronę (F5)
- **Then:** Ekran ładuje się z domyślnym (bieżącym) miesiącem w trybie edycji

## UI / UX

### Stany komponentu (SettingsBudgetScreen)

| Stan | Opis | Zachowanie |
|------|------|------------|
| Loading | Dane wczytywane z IndexedDB | Skeleton/spinner |
| Ready (bieżący miesiąc) | Bieżący miesiąc, tryb edycji | Pełny formularz: karta miesiąca, porównanie, limity kategorii, przycisk Zapisz |
| Ready (historyczny) | Przeszły miesiąc/rok, tryb tylko odczyt | Karta miesiąca/roku + porównanie. **Bez** sekcji limitów i przycisku Zapisz |
| Empty (brak transakcji) | Wybrany okres nie ma transakcji | Karta pokazuje "0 zł", ewentualnie komunikat "Brak wydatków w tym okresie" |
| Error | Błąd odczytu z IndexedDB | Komunikat błędu + przycisk "Spróbuj ponownie" |

### Stany komponentu (NavigationDrawer)

| Stan | Opis | Zachowanie |
|------|------|------------|
| Collapsed | Menu zwinięte | Widoczne tylko nagłówki grup (Transakcje, Budżet, Ustawienia) |
| Expanded (jedna grupa) | Jedna grupa rozwinięta | Podpunkty widoczne z wcięciem, ikonami |
| Active route | Użytkownik jest na danej podstronie | Aktywny podpunkt podświetlony (np. `routerLinkActive`) |

### Interakcje

- **Menu expandable:** Kliknięcie w nagłówek grupy → rozwija/zwija podpunkty (accordion)
- **Dodaj nowe (dialog):** Kliknięcie → zamyka drawer → otwiera `TransactionFormComponent` jako dialog
- **Selektor okresu:** Reużycie `DashboardPeriodSelectorComponent` — identyczne zachowanie jak na dashboardzie
- **Tryb edycji vs odczyt:** Warunkowane przez `isCurrentMonth()` — jeżeli wybrany miesiąc/rok ≠ bieżący → tryb tylko odczyt

## Offline behavior

- **Tryb offline:** Wszystkie dane (transakcje, budżet) są w IndexedDB. Przeglądanie historii działa offline.
- **Dodawanie transakcji:** Działa offline (zapis do IndexedDB) — bez zmian.
- **Powrót online:** Brak synchronizacji (MVP nie ma backendu).

## Architektura

### Dotknięte moduły

| Moduł | Plik | Zmiana |
|-------|------|--------|
| `@ui-transaction` | `transaction-navigation-drawer.component.ts` | Przebudowa na grupowane menu accordion z `MatExpansionPanelModule` + output `addTransactionRequest` |
| `@ui-transaction` | `transaction-navigation-drawer.component.scss` | Nowe style dla accordion (grupy, submenu, aktywne linki) |
| `@feature-transaction` | `transaction-shell/transaction-shell.ts` | Nasłuchiwanie `addTransactionRequest`, otwieranie `TransactionFormComponent` w `MatDialog` |
| `@feature-budget` | `settings-budget-screen.component.ts` | Dodanie `DashboardPeriodSelectorComponent`, warunkowanie trybu edycji/odczytu przez `isCurrentPeriod()` |
| `@feature-budget` | `settings-budget-screen.component.scss` | Style dla selektora okresu, ukrywanie sekcji w trybie tylko odczyt |
| `@feature-budget` | `budget-aggregation.service.ts` | Parametryzacja okresu — przyjmowanie `year`, `month`, `mode` zamiast stałych `getPreviousMonth()` |
| `@feature-budget` | `budget-state.ts` | Nowy sygnał `isCurrentPeriod()` — sprawdza czy wybrany okres to bieżący miesiąc |

### Flow danych

```
[TransactionShellComponent]
    │
    ├── [Sidenav (drawer)]
    │       └── [TransactionNavigationDrawer] ──(addTransactionRequest)──> shell otwiera MatDialog
    │           ├── Grupa "Transakcje" (accordion)
    │           │   ├── "Dodaj nowe" → output
    │           │   └── "Dashboard"  → routerLink /dashboard
    │           ├── Grupa "Budżet"
    │           │   ├── "Dodaj nowy" → routerLink /settings/budget
    │           │   └── "Dashboard"  → routerLink /dashboard
    │           └── Grupa "Ustawienia"
    │               └── "Ustawienia" → routerLink /settings
    │
    └── [Router Outlet]
            └── [SettingsBudgetScreenComponent]
                    ├── [DashboardPeriodSelectorComponent] (reused)
                    │       ├── month/year toggle
                    │       ├── ◀ ▶ navigation
                    │       └── datepicker
                    │
                    ├── isCurrentPeriod() === true
                    │   ├── BudgetCurrentMonthCard (edycja)
                    │   ├── BudgetQuickActions
                    │   ├── BudgetPreviousMonthCard (porównanie)
                    │   ├── BudgetCategoryCard[] (formularz limitów)
                    │   └── Przycisk "Zapisz"
                    │
                    └── isCurrentPeriod() === false
                        ├── BudgetCurrentMonthCard (tylko odczyt)
                        ├── BudgetPreviousMonthCard (porównanie, jeśli dane)
                        └── (sekcja limitów + Zapisz — ukryte)
```

### Uwagi do implementacji

- Zamiast reużycia `DashboardPeriodSelectorComponent` z `@feature-transaction` (co powodowałoby cykliczną zależność: feature-transaction → feature-budget → feature-transaction), **selektor okresu został zaimplementowany bezpośrednio w `SettingsBudgetScreenComponent`** jako własny zestaw sygnałów (`selectedYear`, `selectedMonth`, `periodMode`). Działa identycznie jak oryginalny selektor (nawigacja strzałkami, przełącznik miesiąc/rok), ale jest w pełni niezależny od `DashboardState`.
- `BudgetAggregationService` został rozszerzony o sygnał `selectedPeriod` i powiązane computed'y (`selectedPreviousPeriodSummary`, `selectedPeriodComparison`, `selectedPeriodPercentage`), które są parametryzowane przez okres wybrany w selektorze.

### Szczegóły implementacyjne

#### 1. `TransactionNavigationDrawerComponent` — przebudowa na accordion

```typescript
// Nowy interfejs grupy menu
type MenuGroup = {
  label: string;           // np. "Transakcje"
  icon: string;            // np. "receipt"
  expanded: boolean;       // stan rozwinięcia
  items: MenuItem[];
};

type MenuItem = {
  label: string;           // np. "Dodaj nowe"
  icon: string;            // np. "add"
  route?: string;          // dla routerLink
  action?: 'addTransaction'; // dla akcji (output)
};

// Nowe outputy:
readonly addTransactionRequest = output<void>();
```

Template używa `<mat-accordion>` z `<mat-expansion-panel>` dla każdej grupy.  
Elementy z `action` emitują output zamiast nawigować.  
Motyw zostaje w drawerze (theme switcher poniżej menu — bez zmian).

#### 2. `TransactionShellComponent` — obsługa dialogu

```typescript
// W template:
(closeDrawer)="closeSidebar()"
(addTransactionRequest)="onAddTransactionRequest()"

// Nowa metoda:
onAddTransactionRequest(): void {
  this.closeSidebar();
  // Czekamy chwilę na zamknięcie drawera, potem otwieramy dialog
  setTimeout(() => {
    this.dialog.open(TransactionFormComponent, { ... });
  });
}
```

Używamy `setTimeout` aby drawer zdążył się zamknąć przed otwarciem dialogu (unikamy konfliktu warstw).

#### 3. `SettingsBudgetScreenComponent` — selektor okresu + warunkowanie

```typescript
// Nowe sygnały (podłączone do DashboardPeriodSelector):
readonly selectedYear = signal(getCurrentLocalMonth().year);
readonly selectedMonth = signal(getCurrentLocalMonth().month);
readonly periodMode = signal<PeriodMode>('month');

// Kluczowy computed:
readonly isCurrentPeriod = computed(() => {
  const now = getCurrentLocalMonth();
  return this.periodMode() === 'month'
    && this.selectedYear() === now.year
    && this.selectedMonth() === now.month;
});

// W template:
<transaction-dashboard-period-selector />
// ... karty zawsze widoczne ...
@if (isCurrentPeriod()) {
  // limity kategorii + przycisk Zapisz
}
```

**Uwaga:** `DashboardPeriodSelectorComponent` używa `inject(DashboardState)` bezpośrednio. Oznacza to, że zmiana okresu w selektorze na ekranie budżetu **zmieni również okres na dashboardzie** (współdzielony stan). To jest akceptowalne dla MVP — użytkownik i tak widzi tylko jeden ekran na raz.

Alternatywnie, jeśli chcemy separacji, musimy przekazać stan przez input/output zamiast przez współdzielony serwis. Decyzja: **MVP używa współdzielonego `DashboardState`** — prostsze, nie wymaga refaktoryzacji selektora.

#### 4. `BudgetAggregationService` — parametryzacja okresu

```typescript
// Przed:
readonly previousMonthSummary = computed(() => {
  const prevDate = getPreviousMonth(); // zawsze bieżący-1
  // ...
});

// Po:
private _selectedYear = signal(getCurrentLocalMonth().year);
private _selectedMonth = signal(getCurrentLocalMonth().month);
private _periodMode = signal<PeriodMode>('month');

setPeriod(year: number, month: number, mode: PeriodMode): void {
  this._selectedYear.set(year);
  this._selectedMonth.set(month);
  this._periodMode.set(mode);
}

// Nowy computed — wydatki w wybranym okresie:
readonly selectedPeriodSpent = computed(() => { ... });

// Poprzedni okres to selectedMonth-1 (nie zawsze getPreviousMonth):
readonly selectedPreviousPeriodSummary = computed(() => { ... });

// Dla roku:
readonly selectedYearSpent = computed(() => { ... });
readonly selectedPreviousYearSummary = computed(() => { ... });
```

#### 5. `BudgetState` — sygnał `isCurrentPeriod`

```typescript
// Nowa metoda pomocnicza
isCurrentPeriod(year: number, month: number, mode: PeriodMode): boolean {
  const now = getCurrentLocalMonth();
  return mode === 'month' && year === now.year && month === now.month;
}
```

### Decyzje architektoniczne

- **Reużycie `DashboardPeriodSelectorComponent`** przez współdzielony `DashboardState` — zmiana okresu na ekranie budżetu wpływa też na dashboard i odwrotnie. Akceptowalne dla MVP.
- **`MatExpansionPanelModule`** do menu accordion — już używane w projekcie (`dashboard-category-list`, `settings-categories-section`).
- **Dialog transakcji z `setTimeout`** — proste obejście konfliktu warstw drawer + dialog. Alternatywą jest `cdkOverlay`, ale to overengineering.
- **Parametryzacja `BudgetAggregationService`** zamiast tworzenia osobnego serwisu — minimalna zmiana, maksymalne reużycie.
- **Brak nowych modułów/lib** — wszystkie zmiany w istniejących plikach.

### Task Board

Śledzenie postępu implementacji. Każdy task przechodzi przez statusy:
⬜ **TODO** → 🔄 **In Progress** → ✅ **Done**

| # | Task | Status | Assignee | Notes |
|--:|------|--------|----------|-------|
| 1 | Przebudowa `TransactionNavigationDrawerComponent` na accordion z submenu | ✅ Done | Dev | MatExpansionPanel + output `addTransactionRequest` |
| 2 | Obsługa nowego eventu `addTransactionRequest` w `TransactionShellComponent` | ✅ Done | Dev | Otwiera dialog `TransactionFormComponent` |
| 3 | Dodanie selektora okresu do `SettingsBudgetScreenComponent` | ✅ Done | Dev | Wbudowany selektor (uniezależniony od DashboardState) |
| 4 | Rozszerzenie `BudgetAggregationService` o wsparcie dowolnego okresu | ✅ Done | Dev | Parametryzacja miesiąca/roku poprzez `selectedPeriod` signal |
| 5 | Warunkowanie trybu edycji/odczytu w `SettingsBudgetScreenComponent` | ✅ Done | Dev | `isCurrentPeriod()` → ukryj/pokaż sekcje |
| 6 | Testy jednostkowe: `BudgetAggregationService` dla różnych okresów | ⬜ TODO | Dev | Vitest |
| 7 | Testy komponentowe: `TransactionNavigationDrawerComponent` (nowe menu) | ⬜ TODO | Dev | @testing-library/angular |
| 8 | Testy komponentowe: `SettingsBudgetScreenComponent` (tryb historii) | ⬜ TODO | Dev | @testing-library/angular |
| 9 | Testy E2E: przeglądanie historii budżetu, nowe menu | ⬜ TODO | QA | Playwright |
| 10 | Walidacja quality gate | ⬜ TODO | QA | `npm exec nx affected -t lint test build e2e` |

## Implemented in (wypełniane po implementacji)

| Plik | Data | AC pokryte |
|------|------|------------|
| `libs/transaction/src/lib/ui-transaction/src/lib/ui-transaction/transaction-navigation-drawer.component.ts` | 2026-10-20 | AC-4, AC-5, AC-6, AC-7, AC-8 |
| `libs/transaction/src/lib/ui-transaction/src/lib/ui-transaction/transaction-navigation-drawer.component.scss` | 2026-10-20 | AC-4, AC-5, AC-6, AC-7 |
| `libs/transaction/src/lib/feature-transaction/src/lib/transaction-shell/transaction-shell.ts` | 2026-10-20 | AC-5 |
| `libs/budget/feature-budget/src/lib/components/settings-budget-screen/settings-budget-screen.component.ts` | 2026-10-20 | AC-1, AC-2, AC-3, AC-9, AC-10, AC-11 |
| `libs/budget/feature-budget/src/lib/components/settings-budget-screen/settings-budget-screen.component.scss` | 2026-10-20 | AC-1, AC-2 |
| `libs/budget/feature-budget/src/lib/services/budget-aggregation.service.ts` | 2026-10-20 | AC-1, AC-2, AC-3, AC-11 |

## Zależności

- **Istniejące moduły:**
  - `@ui-transaction` — `TransactionNavigationDrawerComponent` (do przebudowy)
  - `@feature-transaction` — `TransactionShellComponent`, `TransactionFormComponent`, `DashboardPeriodSelectorComponent`
  - `@feature-budget` — `SettingsBudgetScreenComponent`, `BudgetAggregationService`, `BudgetState`
  - `@data-access-transaction` — `TransactionService`, `CategoryService`
  - `@data-access-budget` — `BudgetService`, `CategoryBudgetService`
  - `@ui-budget` — `period-utils`, `BudgetProgressBarComponent`
  - `local-db` — IndexedDB (bez zmian)
- **Powiązane specy:**
  - `docs/specs/budget/planowanie-budzetu.md` — obecny ekran budżetu, który rozszerzamy

## Otwarte pytania

- ✅ ~~Historyczne limity~~ → ignorujemy, tylko wydatki
- ✅ ~~Struktura menu~~ → 3 grupy: Transakcje, Budżet, Ustawienia
- ✅ ~~Dodaj nowe~~ → zamyka drawer, otwiera dialog