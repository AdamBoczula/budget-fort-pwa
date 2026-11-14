# Spec: Recurring Transactions (Transakcje rekurencyjne)

## Metadata
- **Author:** SDLC Orchestrator & BA / Architect
- **Date:** 2026-11-14
- **Status:** implemented
- **Domain:** transaction | settings

---

## Cel biznesowy

Automatyzacja wprowadzania powtarzalnych, comiesięcznych wydatków i opłat stałych (np. czynsz, subskrypcje, media) w modelu offline-first, eliminując konieczność ręcznego wpisywania tych samych transakcji co miesiąc i zapobiegając duplikatom w scenariuszach współdzielenia budżetu (multi-user / offline split-brain).

---

## Zakres (Scope)

### W scope
1. **Model reguły rekurencyjnej (`RecurringTransactionRule`)** w bazie IndexedDB (Dexie).
2. **Deterministyczny mechanizm deduplikacji** zapobiegający powstawaniu podwójnych transakcji w trybie offline i multi-user (identyfikator deterministyczny: `rec_${ruleId}_${yearMonth}`).
3. **Generowanie transakcji na startupie aplikacji (Opcja A):**
   - Transakcja za dany miesiąc generuje się, gdy data systemowa $\ge$ `dayOfMonth` reguły.
   - Mechanizm "catch-up" (jeśli aplikacja nie była otwierana przez kilka miesięcy, system wygeneruje brakujące instancje do aktualnego dnia).
4. **Tworzenie reguły w formularzu transakcji (`transaction-form`):**
   - Przełącznik "Ustaw jako wydatek cykliczny".
   - Wybór dnia miesiąca (domyślnie `1.` dzień miesiąca).
   - Natychmiastowe utworzenie bieżącej transakcji powiązanej z regułą oraz oznaczenie bieżącego miesiąca jako obsłużonego (`lastGeneratedMonth = currentMonth`).
5. **Dedykowany ekran zarządzania regułami w Ustawieniach (`/settings/recurring`):**
   - Lista aktywnych i wstrzymanych opłat stałych.
   - Możliwość edycji kwoty, kategorii, dnia miesiąca.
   - Przełącznik aktywacji/wstrzymania (`isActive`).
   - Usunięcie reguły (soft delete dla celów synchronizacji).
   - Suma comiesięcznych zobowiązań stałych.
6. **Ikonka powtarzalności (`repeat`)** na liście ostatnich transakcji przy pozycjach wygenerowanych z reguły.

### Out of scope
1. Inne interwały niż miesięczne (np. tygodniowe, kwartalne, roczne) – odłożone do przyszłych wydań.
2. Automatyczne generowanie w tle przez Service Worker (odrzucone na rzecz deterministycznego startupu).
3. Automatyczne dynamiczne kwoty (np. zmienny rachunek za prąd) – reguła przechowuje kwotę stałą, a użytkownik może skorygować konkretną wygenerowaną transakcję.

---

## Use Cases (UC)

### UC-1: Utworzenie transakcji z regułą cykliczną w formularzu transakcji
- **Aktor:** Użytkownik
- **Precondition:** Użytkownik otwiera formularz dodawania transakcji.
- **Main flow:**
  1. Użytkownik wprowadza kwotę (np. 55.00 PLN), wybiera kategorię (np. "Subskrypcje"), wpisuje komentarz "Netflix".
  2. Użytkownik zaznacza przełącznik "Ustaw jako wydatek cykliczny".
  3. Pojawia się pole wyboru dnia miesiąca z domyślnie ustawioną wartością `1` (zakres 1–31).
  4. Użytkownik klika "Zapisz".
  5. System tworzy regułę `RecurringTransactionRule` z `lastGeneratedMonth = 'YYYY-MM'` (aktualny miesiąc).
  6. System tworzy instancję `Transaction` z bieżącą datą i przypisanym `recurringRuleId = rule.id`.
  7. Kwota natychmiast zasila aktualny budżet i pojawia się na liście transakcji z ikoną rekurencji.
- **Postcondition:** Transakcja jest zapisana w budżecie, a reguła będzie generować kolejne transakcje począwszy od następnego miesiąca.

### UC-2: Deterministyczne generowanie transakcji na startupie (Single & Multi-user offline)
- **Aktor:** System / Użytkownik uruchamiający aplikację
- **Precondition:** Istnieje aktywna reguła z `dayOfMonth = 1`, `lastGeneratedMonth = '2026-10'`. Dziś jest `2026-11-01`.
- **Main flow:**
  1. Aplikacja inicjalizuje bazę IndexedDB i uruchamia serwis `RecurringTransactionService.generatePendingTransactions()`.
  2. System znajduje regułę i wykrywa brakującą instancję za miesiąc `2026-11`.
  3. Ponieważ bieżący dzień ($1$) $\ge$ `dayOfMonth` ($1$), system generuje ID: `rec_${rule.id}_2026-11`.
  4. System sprawdza, czy transakcja o takim ID już istnieje w tabeli `transaction`. Jeśli nie:
     - Tworzy rekord `Transaction` o id `rec_${rule.id}_2026-11`, dacie `2026-11-01`, z kwotą i kategorią z reguły.
     - Dodaje transakcję do bazy oraz kolejki `syncQueue`.
  5. System aktualizuje regułę: `lastGeneratedMonth = '2026-11'`.
- **Wariant multi-user offline (Deduplikacja):**
  - Jeśli drugi domownik otworzy aplikację na innym urządzeniu w trybie offline tego samego dnia, wygeneruje transakcję o IDENTYCZNYM kluczu `rec_${rule.id}_2026-11`.
  - Po przywróceniu łączności synchronizacja Firebase Firestore wykonuje idempotentny upsert na dokumencie `rec_${rule.id}_2026-11` — nie powstaje żaden duplikat.
- **Postcondition:** Transakcja istnieje w historii i budżecie dokładnie jeden raz.

### UC-3: Przeglądanie i edycja reguł w Ustawieniach
- **Aktor:** Użytkownik
- **Precondition:** Użytkownik przechodzi do widoku `Ustawienia -> Opłaty cykliczne` (`/settings/recurring`).
- **Main flow:**
  1. System prezentuje listę wszystkich reguł z podziałem na aktywne i wstrzymane oraz sumę miesięczną.
  2. Użytkownik klika opłatę (np. "Czynsz 2500 PLN") i zmienia kwotę na 2600 PLN.
  3. Użytkownik zatwierdza zmianę.
  4. System aktualizuje regułę w IndexedDB (oraz `syncQueue`).
- **Postcondition:** Przyszłe transakcje będą generowane z nową kwotą 2600 PLN; dotychczas wygenerowane wpisy w historii zachowują pierwotną kwotę 2500 PLN.

### UC-4: Wstrzymanie lub usunięcie reguły
- **Aktor:** Użytkownik
- **Precondition:** Użytkownik znajduje się na liście reguł w `/settings/recurring`.
- **Main flow:**
  1. Użytkownik wyłącza przełącznik `isActive` przy danej regule (lub klika "Usuń").
  2. System oznacza regułę jako nieaktywną (`isActive = false`) lub usuniętą (`isDeleted = true`).
  3. System NIE usuwa transakcji wygenerowanych w przeszłości.
- **Postcondition:** Reguła nie generuje nowych wpisów w kolejnych miesiącach.

---

## Edge Cases

- **Edge Case 1: Miesiące o różnej liczbie dni (np. luty, kwiecień a dzień 31.)**
  - *Sytuacja:* Reguła ma `dayOfMonth = 31`, a nadszedł luty (28 dni).
  - *Oczekiwane zachowanie:* System generuje transakcję na ostatni dzień danego miesiąca, czyli `2027-02-28` (`Math.min(dayOfMonth, daysInMonth)`).
- **Edge Case 2: Długa nieobecność użytkownika (Catch-up)**
  - *Sytuacja:* Użytkownik nie otwierał aplikacji przez 3 miesiące (np. od sierpnia do listopada).
  - *Oczekiwane zachowanie:* Na starcie system generuje po 1 transakcji za każdy z pominiętych miesięcy (sierpień, wrzesień, październik, listopad) pod warunkiem osiągnięcia dnia płatności w danym miesiącu. Każda transakcja otrzymuje deterministyczne ID z odpowiednim miesiącem.
- **Edge Case 3: Użytkownik ręcznie usunął wygenerowaną transakcję z historii**
  - *Sytuacja:* Użytkownik skasował wygenerowaną transakcję za bieżący miesiąc.
  - *Oczekiwane zachowanie:* Ponieważ w regule `lastGeneratedMonth` jest już ustawiony na bieżący miesiąc (a w bazie rekord transakcji ma `isDeleted: true`), aplikacja NIE wygeneruje ponownie tej samej transakcji przy kolejnym uruchomieniu.
- **Edge Case 4: Opcja A – dzień płatności jeszcze nie nadszedł**
  - *Sytuacja:* Reguła ma `dayOfMonth = 15`. Dzisiaj jest `2026-11-05`.
  - *Oczekiwane zachowanie:* Za listopad transakcja nie zostanie wygenerowana aż do momentu uruchomienia aplikacji w dniu 15 listopada lub później.

---

## Acceptance Criteria (AC)

### AC-1: Zapis reguły z poziomu formularza transakcji
- **Given:** Użytkownik wypełnia formularz transakcji kwotą 100 PLN i kategorią "Media".
- **When:** Użytkownik zaznacza "Ustaw jako wydatek cykliczny", wybiera dzień `1` i klika zapisz.
- **Then:** W bazie powstaje transakcja na bieżący dzień oraz reguła `RecurringTransactionRule` z `dayOfMonth = 1`, `amount = 100`, `lastGeneratedMonth = currentMonth`.

### AC-2: Deterministyczny ID i ochrona przed dublami (Idempotent Catch-up)
- **Given:** W bazie istnieje reguła o ID `rule-123` z `dayOfMonth = 1` i `lastGeneratedMonth = '2026-10'`, a bieżąca data to `2026-11-01`.
- **When:** Serwis startupowy `generatePendingTransactions()` zostaje wywołany wielokrotnie (lub na dwóch urządzeniach jednocześnie).
- **Then:** Powstaje dokładnie 1 transakcja o ID `rec_rule-123_2026-11`, a kolejne wywołania nie tworzą żadnych duplikatów.

### AC-3: Opcja A – wstrzymanie generowania przed terminem
- **Given:** Reguła ma `dayOfMonth = 20`, a dzisiejsza data to `2026-11-10`.
- **When:** Uruchamiana jest aplikacja.
- **Then:** Żadna transakcja za `2026-11` nie zostaje wygenerowana.

### AC-4: Zarządzanie w `/settings/recurring`
- **Given:** Istnieją zdefiniowane reguły w bazie.
- **When:** Użytkownik wchodzi na stronę `/settings/recurring`.
- **Then:** Widzi listę reguł, łączną kwotę miesięczną, może zmienić status `isActive`, edytować kwotę lub usunąć regułę.

### AC-5: Oznaczenie wizualne na liście transakcji
- **Given:** Transakcja posiada wypełnione pole `recurringRuleId`.
- **When:** Użytkownik przegląda listę transakcji na Dashboardzie.
- **Then:** Przy transakcji wyświetlana jest ikonka powtarzalności (`repeat`).

---

## Architektura i Schemat Techniczny

### 1. Migracja Dexie (`BUDGET_FORT_DB_VERSION = 6`)
Dodanie store'a `recurringRule`:
```typescript
export const RECURRING_RULE_DB_TOKEN = 'recurringRule';

export const BUDGET_FORT_DB_STORES = {
  // ... dotychczasowe store'y
  [TRANSACTION_DB_TOKEN]: 'id,date,categoryId,accountId,subcategory,recurringRuleId,updatedAt,isDeleted',
  [RECURRING_RULE_DB_TOKEN]: 'id,categoryId,dayOfMonth,isActive,lastGeneratedMonth,updatedAt,isDeleted',
} as const;
```

### 2. Format Identyfikatora Instancji
```typescript
export function getRecurringTransactionId(ruleId: string, yearMonth: string): string {
  return `rec_${ruleId}_${yearMonth}`;
}
```

---

## Implemented in

| File | Date | AC Covered |
|------|------|------------|
| `libs/shared/local-db/src/lib/local-db.ts` | 2026-11-14 | AC-2 |
| `libs/transaction/src/lib/data-access-transaction/src/lib/data-access-transaction/model/recurring-rule.type.ts` | 2026-11-14 | AC-1, AC-2 |
| `libs/transaction/src/lib/data-access-transaction/src/lib/data-access-transaction/model/transaction.type.ts` | 2026-11-14 | AC-1, AC-5 |
| `libs/transaction/src/lib/data-access-transaction/src/lib/data-access-transaction/recurring-rule/recurring-rule-store.ts` | 2026-11-14 | AC-1, AC-4 |
| `libs/transaction/src/lib/data-access-transaction/src/lib/data-access-transaction/recurring-rule/recurring-rule.service.ts` | 2026-11-14 | AC-4 |
| `libs/transaction/src/lib/data-access-transaction/src/lib/data-access-transaction/recurring-rule/recurring-transaction-generator.service.ts` | 2026-11-14 | AC-2, AC-3 |
| `libs/transaction/src/lib/feature-transaction/src/lib/initializers/category-initializer.ts` | 2026-11-14 | AC-2 |
| `libs/transaction/src/lib/feature-transaction/src/lib/service/transaction-state/transaction-state.ts` | 2026-11-14 | AC-1 |
| `libs/transaction/src/lib/feature-transaction/src/lib/transaction-form/transaction-form.ts` | 2026-11-14 | AC-1 |
| `libs/transaction/src/lib/feature-transaction/src/lib/last-transaction/last-transaction-item/last-transaction-item.ts` | 2026-11-14 | AC-5 |
| `libs/transaction/src/lib/feature-transaction/src/lib/settings-screen/settings-recurring-section/settings-recurring-section.ts` | 2026-11-14 | AC-4 |
| `apps/budget-fort-e2e/src/recurring-transactions.spec.ts` | 2026-11-14 | AC-1, AC-4 |
