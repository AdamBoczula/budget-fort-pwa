# Spec: Planowanie budżetu

## Metadata
- **Author:** aboczula
- **Date:** 2026-10-17
- **Status:** confirmed
- **Domain:** budget

## Cel biznesowy

Użytkownik może ustawić miesięczny budżet ogólny oraz limity wydatków na poszczególne kategorie,
a następnie śledzić ich wykorzystanie wizualnie na dashboardzie za pomocą pasków postępu
z progami kolorów (zielony < 80%, żółty 80–99%, czerwony ≥ 100%).

## Zakres (Scope)

### W scope
- Ustawienie stałego miesięcznego budżetu ogólnego (kwota)
- Ustawienie limitów miesięcznych na wybrane kategorie (kwota)
- Wyświetlanie progresu budżetu ogólnego na dashboardzie (pasek + % wykorzystania)
- Wyświetlanie progresu limitów kategorii na dashboardzie (pasek + % wykorzystania per kategoria)
- Progi kolorów: zielony < 80%, żółty 80–99%, czerwony ≥ 100%
- Osobna strona/podstrona do zarządzania budżetem i limitami (ustawienia)
- Do budżetu i limitów wliczane są tylko wydatki (expense), nie przychody (income)
- Budżet ogólny i limity kategorii są od siebie niezależne
- Okresem rozliczeniowym jest miesiąc kalendarzowy (timezone: Europe/Warsaw)
- Offline-first — dane przechowywane lokalnie w IndexedDB

### Out of scope
- Powiadomienia push/email o przekroczeniu budżetu
- Konfigurowalne progi ostrzegawcze (na sztywno 80%)
- Nadpisywanie budżetu dla konkretnego miesiąca (stała kwota, zmieniana ręcznie)
- Budżet roczny / kwartalny
- Import/eksport budżetów
- Synchronizacja z chmurą (brak backendu w MVP)
- Budżetowanie przychodów (tylko wydatki)

## Use Cases (UC)

### UC-1: Ustawienie budżetu ogólnego

- **Aktor:** Użytkownik
- **Precondition:** Użytkownik jest na stronie ustawień budżetu. Budżet nie został jeszcze ustawiony (wartość domyślna: 0 lub brak).
- **Main flow:**
  1. Użytkownik przechodzi do **osobnej strony ustawień budżetu** (`/settings/budget`)
  2. System wyświetla pole tekstowe na kwotę budżetu ogólnego (puste lub z aktualną wartością)
  3. Użytkownik wpisuje kwotę (np. 5000) i klika "Zapisz"
  4. System waliduje kwotę (≥ 0, max 2 miejsca po przecinku)
  5. System zapisuje budżet w IndexedDB i wyświetla komunikat potwierdzenia
- **Postcondition:** Budżet ogólny zapisany. Dashboard zaczyna pokazywać progres dla bieżącego miesiąca.

### UC-2: Ustawienie limitu na kategorię

- **Aktor:** Użytkownik
- **Precondition:** Użytkownik jest na stronie ustawień budżetu. Istnieją kategorie w systemie.
- **Main flow:**
  1. Użytkownik widzi listę kategorii z polami na limit (puste = brak limitu)
  2. Użytkownik wpisuje kwotę limitu przy wybranej kategorii (np. "Jedzenie: 1500")
  3. Użytkownik klika "Zapisz" (lub zapis następuje automatycznie po zmianie)
  4. System waliduje kwotę (≥ 0, max 2 miejsca po przecinku)
  5. System zapisuje limit kategorii w IndexedDB
- **Postcondition:** Limit dla kategorii zapisany. Dashboard pokazuje progres dla tej kategorii w bieżącym miesiącu.

### UC-3: Przeglądanie progresu na dashboardzie

- **Aktor:** Użytkownik
- **Precondition:** Użytkownik ma ustawiony budżet ogólny i/lub limity kategorii. W bieżącym miesiącu istnieją transakcje wydatkowe.
- **Main flow:**
  1. Użytkownik otwiera dashboard (ekran główny)
  2. System wyświetla **najpierw budżet ogólny** (u góry): pasek postępu (wydatki / budżet × 100%) z odpowiednim kolorem
  3. Poniżej system wyświetla **listę kategorii z limitami**: dla każdej kategorii z ustawionym limitem — pasek postępu z odpowiednim kolorem
  4. Kategorie bez limitu nie pokazują paska postępu
  5. Paski postępu są tylko do odczytu — kliknięcie może przenosić do ustawień budżetu
- **Postcondition:** Użytkownik widzi wizualny stan wykorzystania budżetu i limitów.

### UC-4: Zmiana budżetu ogólnego

- **Aktor:** Użytkownik
- **Precondition:** Budżet ogólny jest już ustawiony.
- **Main flow:**
  1. Użytkownik przechodzi do ustawień budżetu
  2. System wyświetla aktualną kwotę budżetu w polu tekstowym
  3. Użytkownik zmienia kwotę i klika "Zapisz"
  4. System aktualizuje budżet w IndexedDB
- **Postcondition:** Nowa kwota budżetu obowiązuje dla bieżącego i przyszłych miesięcy. Progres na dashboardzie przeliczony względem nowej kwoty.

### UC-5: Usunięcie limitu kategorii

- **Aktor:** Użytkownik
- **Precondition:** Kategoria ma ustawiony limit.
- **Main flow:**
  1. Użytkownik przechodzi do ustawień budżetu
  2. Użytkownik usuwa kwotę z pola limitu danej kategorii (lub klika "Usuń limit")
  3. System zapisuje brak limitu dla tej kategorii
- **Postcondition:** Kategoria nie ma już limitu. Pasek postępu dla tej kategorii znika z dashboardu.

## Edge Cases

- **Edge Case 1:** Budżet ogólny = 0
  - **Oczekiwane zachowanie:** Dashboard nie pokazuje paska postępu budżetu ogólnego (lub pokazuje "Nie ustawiono budżetu"). Brak limitu = brak presji budżetowej.

- **Edge Case 2:** Wszystkie kategorie bez limitów
  - **Oczekiwane zachowanie:** Dashboard pokazuje tylko budżet ogólny (jeśli ustawiony). Sekcja kategorii jest pusta lub z komunikatem "Brak limitów kategorii".

- **Edge Case 3:** Brak transakcji w bieżącym miesiącu
  - **Oczekiwane zachowanie:** Paski postępu pokazują 0% (zielony). Wyświetlana jest kwota "0 / [budżet] zł".

- **Edge Case 4:** Wydatki przekraczają budżet/limit (≥ 100%)
  - **Oczekiwane zachowanie:** Pasek jest czerwony i wypełniony w 100%. Wyświetlana kwota: "[wydatki] / [budżet] zł". Pasek nie rozszerza się ponad 100% — pozostaje pełny.

- **Edge Case 5:** Usunięcie kategorii która ma limit
  - **Oczekiwane zachowanie:** Limit jest usuwany razem z kategorią (kaskadowo). Nie ma osieroconych limitów.

- **Edge Case 6:** Zmiana miesiąca (np. z października na listopad)
  - **Oczekiwane zachowanie:** Progres dotyczy zawsze bieżącego miesiąca kalendarzowego. 1 listopada paski resetują się do 0%. Historyczne dane nie są potrzebne w MVP.

- **Edge Case 7:** Kwota z więcej niż 2 miejscami po przecinku
  - **Oczekiwane zachowanie:** System zaokrągla do 2 miejsc po przecinku (half-up) lub odrzuca input z komunikatem walidacji.

- **Edge Case 8:** Ujemna kwota budżetu/limitu
  - **Oczekiwane zachowanie:** Walidacja odrzuca — minimalna wartość to 0.

## Acceptance Criteria (AC)

### AC-1: Ustawienie budżetu ogólnego

- **Given:** Użytkownik jest na stronie ustawień budżetu, budżet nie jest ustawiony
- **When:** Użytkownik wpisuje "5000" i klika "Zapisz"
- **Then:** Budżet zostaje zapisany. Dashboard pokazuje pasek postępu budżetu ogólnego z kwotą "0 / 5000 zł" i 0%.

### AC-2: Ustawienie limitu kategorii

- **Given:** Użytkownik jest na stronie ustawień budżetu, istnieje kategoria "Jedzenie"
- **When:** Użytkownik wpisuje "1500" przy kategorii "Jedzenie" i klika "Zapisz"
- **Then:** Limit zostaje zapisany. Dashboard pokazuje pasek postępu dla kategorii "Jedzenie" z limitem 1500 zł.

### AC-3: Progres budżetu z kolorem zielonym

- **Given:** Budżet ogólny = 5000 zł. W bieżącym miesiącu wydano 2000 zł.
- **When:** Użytkownik otwiera dashboard
- **Then:** Pasek postępu budżetu jest zielony, pokazuje 40% (2000/5000).

### AC-4: Progres budżetu z kolorem żółtym

- **Given:** Budżet ogólny = 5000 zł. W bieżącym miesiącu wydano 4200 zł.
- **When:** Użytkownik otwiera dashboard
- **Then:** Pasek postępu budżetu jest żółty, pokazuje 84% (4200/5000).

### AC-5: Progres budżetu z kolorem czerwonym

- **Given:** Budżet ogólny = 5000 zł. W bieżącym miesiącu wydano 5200 zł.
- **When:** Użytkownik otwiera dashboard
- **Then:** Pasek postępu budżetu jest czerwony, wypełniony w 100%, wyświetla "5200 / 5000 zł".

### AC-6: Progres limitu kategorii z kolorem żółtym

- **Given:** Limit kategorii "Jedzenie" = 1500 zł. W bieżącym miesiącu wydano 1350 zł na jedzenie.
- **When:** Użytkownik otwiera dashboard
- **Then:** Pasek postępu kategorii "Jedzenie" jest żółty, pokazuje 90% (1350/1500).

### AC-7: Kategoria bez limitu nie pokazuje paska

- **Given:** Kategoria "Transport" istnieje ale nie ma ustawionego limitu
- **When:** Użytkownik otwiera dashboard
- **Then:** Kategoria "Transport" nie jest wyświetlana w sekcji limitów kategorii (brak paska postępu).

### AC-8: Tylko wydatki wliczają się do budżetu

- **Given:** Budżet ogólny = 5000 zł. W bieżącym miesiącu: wydatki 3000 zł, przychody 2000 zł.
- **When:** Użytkownik otwiera dashboard
- **Then:** Pasek postępu pokazuje 3000 / 5000 zł (60%), przychody nie pomniejszają wykorzystania.

### AC-9: Zmiana budżetu w trakcie miesiąca

- **Given:** Budżet ogólny = 5000 zł, wydano 3000 zł (60%).
- **When:** Użytkownik zmienia budżet na 6000 zł
- **Then:** Dashboard przelicza progres: 3000 / 6000 zł (50%), pasek zielony.

### AC-10: Usunięcie limitu kategorii

- **Given:** Kategoria "Rozrywka" ma limit 500 zł
- **When:** Użytkownik usuwa limit (ustawia pustą wartość) i zapisuje
- **Then:** Pasek postępu "Rozrywka" znika z dashboardu.

### AC-11: Dane przetrwają odświeżenie strony (offline-first)

- **Given:** Ustawiony budżet ogólny = 5000 zł i limit "Jedzenie" = 1500 zł
- **When:** Użytkownik odświeża stronę (F5)
- **Then:** Budżet i limit są nadal wyświetlane poprawnie na dashboardzie i w ustawieniach.

## Model danych

```typescript
// Budżet ogólny — jeden rekord, stała kwota miesięczna
interface Budget {
  id: number;           // zawsze 1 (singleton)
  amount: number;       // kwota w zł, ≥ 0, max 2 miejsca po przecinku
  updatedAt: string;    // ISO 8601 timestamp
}

// Limit kategorii — jeden rekord na kategorię
interface CategoryBudget {
  id?: number;              // auto-generated
  categoryId: number;       // FK do kategorii
  categoryName: string;     // denormalizowane dla wygody wyświetlania
  amount: number;           // kwota limitu w zł, ≥ 0, max 2 miejsca po przecinku
  updatedAt: string;        // ISO 8601 timestamp
}
```

- **Walidacja:** `amount ≥ 0`, zaokrąglenie do 2 miejsc po przecinku (half-up)
- **Singleton Budget:** tylko jeden rekord z `id = 1`. Zmiana kwoty = update tego rekordu.

## UI / UX

### Stany komponentu (Dashboard — sekcja budżetu)

| Stan | Opis | Zachowanie |
|------|------|------------|
| Loading | Dane budżetu/limitów są wczytywane z IndexedDB | Skeleton placeholder dla pasków postępu |
| Empty | Budżet nieustawiony (amount = 0) | Komunikat: "Nie ustawiono budżetu miesięcznego" + link do ustawień |
| Empty (kategorie) | Żadna kategoria nie ma limitu | Komunikat: "Brak limitów kategorii" |
| Success | Budżet i/lub limity ustawione | Paski postępu z kolorami |
| Error | Błąd odczytu z IndexedDB | Komunikat błędu + przycisk "Spróbuj ponownie" |

### Stany komponentu (Ustawienia budżetu)

| Stan | Opis | Zachowanie |
|------|------|------------|
| Loading | Dane wczytywane | Skeleton dla pól formularza |
| Ready | Formularz gotowy | Pola tekstowe z aktualnymi wartościami |
| Saving | Zapis w toku | Przycisk "Zapisz" disabled + spinner |
| Saved | Zapis udany | Krótki komunikat "Zapisano" (snackbar) |
| Validation error | Niepoprawna wartość | Komunikat walidacji pod polem (np. "Kwota musi być ≥ 0") |

### Interakcje

- **Dashboard:** Paski postępu są tylko do odczytu (nieklikalne lub kliknięcie przenosi do ustawień)
- **Ustawienia budżetu:** Osobna strona dostępna przez route `/settings/budget`
  - Pole "Budżet miesięczny" (number input)
  - Lista **wszystkich kategorii wydatkowych** z polami "Limit" (number input) — kategorie bez limitu mają puste pole
  - Przycisk "Zapisz" dla całego formularza

### Progi kolorów paska postępu

| Wykorzystanie | Kolor | Kod |
|---------------|-------|-----|
| < 80% | Zielony | `#4caf50` |
| 80% – 99% | Żółty/bursztynowy | `#ff9800` |
| ≥ 100% | Czerwony | `#f44336` |

## Offline behavior

- **Tryb offline:** Budżet i limity są zapisywane i odczytywane lokalnie z IndexedDB (Dexie). Wszystkie operacje (ustawienie, zmiana, odczyt progresu) działają bez połączenia z siecią.
- **Powrót online:** Dane pozostają bez zmian — MVP nie ma backendu, więc nie ma synchronizacji.

## Architektura

### Dotknięte moduły

| Moduł | Plik | Zmiana |
|-------|------|--------|
| `local-db` | `libs/shared/local-db/src/lib/local-db.ts` | Nowe store'y: `budget`, `categoryBudget` + tokeny |
| `@feature-budget` | `libs/budget/feature-budget/` | **Nowy moduł** — strona `/settings/budget`, BudgetState (serwis z progresem), komponent ustawień budżetu |
| `@data-access-budget` | `libs/budget/data-access-budget/` | **Nowy moduł** — BudgetService (CRUD dla Budget + CategoryBudget) |
| `@ui-budget` | `libs/budget/ui-budget/` | **Nowy moduł** — BudgetProgressBar (pasek postępu z kolorami) |
| `@feature-transaction` | `libs/transaction/.../dashboard-screen/dashboard-screen.ts` | Dodanie komponentów progresu budżetu (z `@ui-budget`) |
| `budget-fort` | `apps/budget-fort/src/app/app.routes.ts` | Nowy lazy route dla `@feature-budget` |

### Flow danych

```
[DashboardScreen] --czyta--> [BudgetState (feature-budget)] --woła--> [BudgetService (data-access-budget)]
                                                                             │
                                                                       [IndexedDB]
                                                                       budget / categoryBudget stores

[DashboardScreen] --wyświetla--> [BudgetProgressBar (ui-budget)] <--dane-- [BudgetState]

[SettingsBudgetScreen (feature-budget)] --zapisuje--> [BudgetService] --> [IndexedDB]
```

### Decyzje architektoniczne (ADR)

- **ADR-001:** Domena `budget` jako osobna struktura `libs/budget/` (nie rozszerzamy `libs/transaction/`)
- Budżet ogólny i limity kategorii w osobnych store'ach IndexedDB (`budget`, `categoryBudget`)
- `BudgetState` (w `feature-budget`) — dedykowany serwis do obliczania progresu (wydatki vs limit)
- Progi kolorów (80%, 100%) w czystej funkcji utility — nie w komponencie
- Dane budżetu są leniwie ładowane (resource API) — nie blokują renderowania dashboardu

### Task Board

Śledzenie postępu implementacji. Każdy task przechodzi przez statusy:
⬜ **TODO** → 🔄 **In Progress** → ✅ **Done**

| # | Task | Status | Assignee | Notes |
|---|------|--------|----------|-------|
| 1 | Dodać store'y `budget` i `categoryBudget` do schemy Dexie w `local-db` | ✅ Done | Dev | Tokeny + schemat w `BUDGET_FORT_DB_STORES` |
| 2 | Stworzyć `libs/budget/data-access-budget` — BudgetService + CategoryBudgetService + typy | ✅ Done | Dev | Nx generate + implementacja CRUD |
| 3 | Stworzyć `libs/budget/ui-budget` — BudgetProgressBar (pasek z kolorami) | ✅ Done | Dev | Komponent z input: spent, limit; output: kolor |
| 4 | Stworzyć `libs/budget/feature-budget` — BudgetState (obliczanie progresu) | ✅ Done | Dev | Serwis korzystający z BudgetService + TransactionService |
| 5 | Stworzyć stronę `/settings/budget` (SettingsBudgetScreen) | ⬜ TODO | Dev | Formularz: budżet ogólny + lista kategorii z limitami |
| 6 | Dodać komponenty progresu do DashboardScreen | ⬜ TODO | Dev | Import BudgetProgressBar, użycie BudgetState |
| 7 | Zarejestrować lazy route `/settings/budget` w `app.routes.ts` | ⬜ TODO | Dev | Nowy route dla `@feature-budget` |
| 8 | Dodać testy jednostkowe: BudgetService, BudgetState, money-utils (progi kolorów) | ⬜ TODO | Dev | Vitest |
| 9 | Dodać testy komponentowe: BudgetProgressBar, SettingsBudgetScreen | ⬜ TODO | Dev | @testing-library/angular |
| 10 | Dodać testy E2E: ustawienie budżetu, progres na dashboardzie, zmiana limitu | ⬜ TODO | QA | Playwright |
| 11 | Walidacja quality gate | ⬜ TODO | QA | `npm exec nx affected -t lint test build e2e` |

## Implemented in (wypełniane po implementacji)

| Plik | Data | AC pokryte |
|------|------|------------|
| `libs/shared/local-db/src/lib/local-db.ts` | 2026-10-18 | AC-1, AC-2, AC-11 |
| `libs/budget/data-access-budget/src/lib/model/budget.type.ts` | 2026-10-18 | AC-1 |
| `libs/budget/data-access-budget/src/lib/model/category-budget.type.ts` | 2026-10-18 | AC-2 |
| `libs/budget/data-access-budget/src/lib/services/budget.service.ts` | 2026-10-18 | AC-1, AC-9, Edge Case 1, Edge Case 7 |
| `libs/budget/data-access-budget/src/lib/services/category-budget.service.ts` | 2026-10-18 | AC-2, AC-7, AC-10, AC-11 |
| `libs/budget/ui-budget/src/lib/utils/progress-color-utils.ts` | 2026-10-18 | AC-3, AC-4, AC-5, AC-6 |
| `libs/budget/ui-budget/src/lib/components/budget-progress-bar.component.ts` | 2026-10-18 | AC-3, AC-4, AC-5, AC-6, Edge Case 1, Edge Case 3 |
| `libs/budget/feature-budget/src/lib/services/budget-state.ts` | 2026-10-18 | AC-1, AC-2, AC-3, AC-6, AC-7, AC-8, Edge Case 1, Edge Case 3, Edge Case 10 |

## Zależności

- **Istniejące moduły:**
  - `local-db` — Dexie/IndexedDB do przechowywania `Budget` i `CategoryBudget`
  - `@data-access-transaction` — do pobierania sumy wydatków w bieżącym miesiącu (do obliczania progresu)
  - `@feature-transaction` — dashboard (ekran główny), gdzie będzie wyświetlany progres
- **Powiązane specy:**
  - `docs/specs/transaction/add-transaction.md` — wydatki są źródłem danych dla progresu
  - `docs/specs/category/zarzadzanie-kategoriami.md` — kategorie są używane przy limitach
- **ADR:**
  - `docs/adr/001-budget-separate-domain.md` — Decyzja o wydzieleniu domeny `budget` do osobnych libs

## Otwarte pytania

- ✅ ~~Kolejność dashboardu~~ → Budżet ogólny nad kategoriami
- ✅ ~~Strona ustawień~~ → Osobna strona z własnym route'em (`/settings/budget`)
- ✅ ~~Limit na liście transakcji~~ → Tylko na dashboardzie, nie na liście transakcji
- ✅ ~~Wyświetlanie kategorii bez limitu~~ → Wszystkie kategorie wydatkowe + puste pole limitu