# Spec: Współdzielony Budżet Domowy (Multi-user Household & Synchronization)

## Metadata

- **Author:** Adam & Antigravity (Architect & BA)
- **Date:** 2026-11-14
- **Status:** confirmed
- **Domain:** sync | auth | transaction

---

## Cel biznesowy

Umożliwienie domownikom i partnerom wspólnego prowadzenia budżetu domowego w oparciu o jedno wspólne Gospodarstwo Domowe (`householdId`), z natychmiastowym działaniem w trybie offline (IndexedDB), automatyczną synchronizacją dwukierunkową z Cloud Firestore, transparentnym scalaniem zmian metodą Field-level Last-Write-Wins (LWW) oraz oznaczeniem autora wpisu transakcji.

---

## Zakres (Scope)

### W scope

1. **Model Gospodarstwa Domowego (`householdId`):**
   - Automatyczne powiązanie każdego nowego zalogowanego użytkownika z domyślnym gospodarstwem (`householdId = user.uid` lub unikalny identyfikator).
   - Możliwość wygenerowania prostego kodu zaproszenia (`inviteCode`, np. 6-cyfrowy) dla drugiego domownika.
   - Możliwość dołączenia do istniejącego gospodarstwa domowego partnera za pomocą kodu zaproszenia.
2. **Struktura danych i migracja lokalna (Dexie v7):**
   - Rozszerzenie encji `SyncableEntity` o `householdId?: string`.
   - Rozszerzenie modelu `Transaction` o `authorId?: string` oraz `authorName?: string`.
   - Podbicie wersji IndexedDB do 7 z zachowaniem dotychczasowych danych lokalnych i przypisaniem ich do bieżącego gospodarstwa domowego.
3. **Synchronizacja z Cloud Firestore pod ścieżką `/households/{householdId}/*`:**
   - Przekierowanie operacji `pushBatch`, `pullChanges` (Delta Pull) oraz `pullAll` z izolacji `/users/{userId}/*` na współdzieloną kolekcję `/households/{householdId}/*`.
   - Synchronizacja kolekcji: `transaction`, `category`, `subcategory`, `budget`, `categoryBudget`, `recurringRule`.
4. **Rozwiązywanie konfliktów (Field-level LWW):**
   - Deterministyczne scalanie na poziomie pól w oparciu o znacznik `updatedAt`.
   - Brak blokujących ekranów / okien modalnych w UI (operacje dopisywania i edycji są merge'owane w tle).
5. **Reguły bezpieczeństwa Cloud Firestore (`firestore.rules`):**
   - Zapewnienie, że tylko uwierzytelnieni użytkownicy będący w tablicy `members` danego gospodarstwa mogą odczytywać i zapisywać jego dane.
6. **Interfejs Użytkownika (UI):**
   - Sekcja "Gospodarstwo Domowe" w ekranie Ustawień / Profilu:
     - Wyświetlanie nazwy gospodarstwa i listy członków.
     - Przycisk "Kopiuj kod zaproszenia".
     - Formularz "Dołącz do gospodarstwa partnera" (pole na 6-znakowy kod zaproszenia).
   - Oznaczenie autora wpisu w szczegółach / na liście transakcji (np. mały chip / avatar z inicjałami lub imieniem autora).

### Out of scope

- Zaawansowany system ról i uprawnień wewnątrz gospodarstwa (np. role admin, view-only, dziecko) – na tym etapie wszyscy domownicy mają równe uprawnienia do edycji budżetu.
- Ręczny modal rozwiązywania konfliktów (zgodnie z decyzją w `docs/roadmap.md`).
- Obsługa wielu aktywnych gospodarstw jednocześnie (jeden użytkownik jest w danym momencie przypisany do jednego aktywnego gospodarstwa).

---

## Use Cases (UC)

### UC-1: Automatyczne tworzenie gospodarstwa przy pierwszym logowaniu

- **Aktor:** Nowy użytkownik po rejestracji/logowaniu.
- **Precondition:** Użytkownik nie posiada jeszcze przypisanego `householdId`.
- **Main flow:**
  1. System wykrywa brak rekordu `/users/{uid}` w chmurze lub brak `currentHouseholdId`.
  2. System tworzy dokument w `/households/{householdId}` (gdzie `householdId = uid`) z nazwą "Budżet Domowy", członkiem `[uid]` oraz generuje `inviteCode`.
  3. System zapisuje w `/users/{uid}` referencję `currentHouseholdId = householdId`.
  4. Dane lokalne z IndexedDB zostają oznaczone bieżącym `householdId` i zsynchronizowane do chmury.
- **Postcondition:** Użytkownik ma aktywne gospodarstwo domowe gotowe do synchronizacji i zapraszania domowników.

### UC-2: Rejestracja wydatku z identyfikacją autora

- **Aktor:** Zalogowany domownik.
- **Precondition:** Aplikacja działa online lub offline, użytkownik jest uwierzytelniony.
- **Main flow:**
  1. Użytkownik dodaje transakcję przez standardowy formularz lub Quick Add.
  2. System przypisuje do transakcji: `householdId = currentHouseholdId`, `authorId = user.uid`, `authorName = user.displayName || user.email`.
  3. Transakcja zostaje natychmiast zapisana w lokalnym IndexedDB i dodana do `syncQueue`.
  4. Przy dostępności sieci transakcja trafia do `/households/{householdId}/transaction/{id}`.
- **Postcondition:** Wydatek jest widoczny lokalnie natychmiast, a w chmurze zawiera dane autora.

### UC-3: Dołączenie partnera do istniejącego gospodarstwa domowego

- **Aktor:** Drugi domownik (Partner).
- **Precondition:** Partner założył konto w Budget Fort i otrzymał kod zaproszenia od założyciela.
- **Main flow:**
  1. Partner wchodzi w Ustawienia $\rightarrow$ Gospodarstwo Domowe.
  2. Wpisuje 6-znakowy kod zaproszenia i klika "Dołącz".
  3. System weryfikuje kod w Firestore (wyszukuje gospodarstwo z pasującym `inviteCode`).
  4. System dodaje UID partnera do tablicy `members` znalezionego gospodarstwa domowego oraz aktualizuje pole `currentHouseholdId` partnera.
  5. `SyncEngineService` uruchamia pełne pobranie (`initialPull`) danych współdzielonego gospodarstwa do lokalnego IndexedDB partnera.
- **Postcondition:** Obaj partnerzy widzą te same kategorie, budżety i transakcje.

### UC-4: Niezależne wprowadzanie wydatków (Brak konfliktów)

- **Aktor:** Partner A i Partner B.
- **Precondition:** Obaj partnerzy należą do tego samego gospodarstwa i są w sklepach w trybie offline/online.
- **Main flow:**
  1. Partner A wprowadza wydatek na kwotę 50 zł za zakupy spożywcze.
  2. Partner B wprowadza w tym samym czasie wydatek 120 zł za paliwo.
  3. Obydwie aplikacje synchronizują zmiany z Cloud Firestore.
  4. Mechanizm Delta Sync pobiera transakcję A na telefon B oraz transakcję B na telefon A.
- **Postcondition:** W obu telefonach suma wydatków w kategorii i na ekranie głównym jest w 100% spójna.

### UC-5: Równoczesna modyfikacja tej samej transakcji (LWW)

- **Aktor:** Partner A i Partner B.
- **Precondition:** Ta sama transakcja `TX-123` jest edytowana przez obu domowników w trybie offline.
- **Main flow:**
  1. Partner A zmienia kategorię transakcji o godzinie 14:00 (`updatedAt: 14:00:00`).
  2. Partner B zmienia kwotę transakcji o godzinie 14:05 (`updatedAt: 14:05:00`).
  3. Zmiany synchronizują się z Firestore.
  4. Wersja Partnera B (nowsza) ma pierwszeństwo dla zmodyfikowanych pól, a wersja końcowa łączy zmiany zgodnie z LWW.
- **Postcondition:** Brak blokujących okien w UI; transakcja jest spójna na obu urządzeniach.

---

## Edge Cases

1. **Użytkownik dołącza do gospodarstwa, mając już własne lokalne transakcje:**
   - Opcja w UI: scal dotychczasowe transakcje z nowym gospodarstwem lub przełącz się na nowe gospodarstwo.
2. **Błędny lub wygasły kod zaproszenia:**
   - Komunikat błędu w formularzu z zachowaniem wprowadzonego tekstu.
3. **Praca w trybie Gościa:**
   - W trybie gościa `householdId = 'local'`, brak komunikacji z Firebase, funkcja zaproszeń jest zablokowana do momentu rejestracji konta.

---

## Acceptance Criteria (AC)

### AC-1: Automatyczne utworzenie gospodarstwa domowego

- **Given:** Użytkownik loguje się po raz pierwszy na nowe konto Firebase.
- **When:** Serwis autoryzacji i synchronizacji inicjalizuje sesję.
- **Then:** Zostaje utworzone domyślne gospodarstwo domowe w Firestore z unikalnym kodem zaproszenia, a profil użytkownika otrzymuje powiązane `currentHouseholdId`.

### AC-2: Powiązanie transakcji z gospodarstwem i autorem

- **Given:** Zalogowany użytkownik Jan dodaje wydatek.
- **When:** Zapis zostaje wykonany w aplikacji.
- **Then:** Nowa transakcja w IndexedDB oraz w Firestore posiada pola: `householdId = currentHouseholdId`, `authorId = jan.uid`, `authorName = 'Jan'`.

### AC-3: Synchronizacja dwukierunkowa na poziomie gospodarstwa domowego

- **Given:** Użytkownik A i Użytkownik B należą do tego samego gospodarstwa.
- **When:** Użytkownik A dodaje wydatek, a Użytkownik B wykonuje synchronizację.
- **Then:** Wydatek użytkownika A pojawia się w IndexedDB użytkownika B z poprawną kwotą, kategorią i autorem.

### AC-4: Dołączenie do gospodarstwa za pomocą kodu zaproszenia

- **Given:** Partner posiada ważny 6-znakowy kod zaproszenia od założyciela gospodarstwa.
- **When:** Wprowadza kod w sekcji Ustawienia $\rightarrow$ Gospodarstwo Domowe i zatwierdza.
- **Then:** Zostaje dopisany do `members` gospodarstwa, jego `currentHouseholdId` zostaje zaktualizowany, a dane budżetu gospodarstwa pobierają się do jego lokalnej bazy IndexedDB.

### AC-5: Bezpieczeństwo Firestore (Odmowa dostępu dla osób trzecich)

- **Given:** Użytkownik C nie jest członkiem gospodarstwa domowego `H-1`.
- **When:** Użytkownik C próbuje odczytać lub zmodyfikować kolekcję `/households/H-1/transaction`.
- **Then:** Reguły `firestore.rules` odrzucają żądanie ze statusem `permission-denied`.

### AC-6: Rozstrzyganie konfliktów LWW bez modali

- **Given:** Wersja lokalna encji ma starszy `updatedAt` niż wersja zdalna pobrana z Firestore.
- **When:** `SyncEngineService` przetwarza deltę.
- **Then:** Nowsza wersja ze zdalnego serwera nadpisuje lokalny rekord bez wyświetlania modali blokujących użytkownika.

---

## Model danych

```typescript
export interface Household {
  id: string;
  name: string;
  ownerUid: string;
  members: string[]; // UID członków z dostępem
  inviteCode: string; // 6-znakowy kod np. 'BF89X2'
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  isDeleted?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  currentHouseholdId: string;
  updatedAt: string;
}

export interface HouseholdTransactionExtension {
  householdId?: string;
  authorId?: string;
  authorName?: string;
}
```

---

## Implemented in

| File                                                                                                                            | Date       | AC Covered             |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------- |
| `libs/shared/local-db/src/lib/local-db.ts`                                                                                      | 2026-11-14 | AC-1, AC-2             |
| `libs/shared/local-db/src/lib/sync.types.ts`                                                                                    | 2026-11-14 | AC-1, AC-2             |
| `libs/transaction/src/lib/data-access-transaction/src/lib/data-access-transaction/model/transaction.type.ts`                    | 2026-11-14 | AC-2                   |
| `libs/sync/data-access-sync/src/lib/services/firestore-sync.service.ts`                                                         | 2026-11-14 | AC-1, AC-3, AC-4       |
| `libs/sync/data-access-sync/src/lib/services/sync-engine.service.ts`                                                            | 2026-11-14 | AC-1, AC-3, AC-4, AC-6 |
| `libs/sync/data-access-sync/src/lib/state/sync.state.ts`                                                                        | 2026-11-14 | AC-1, AC-4             |
| `libs/transaction/src/lib/feature-transaction/src/lib/service/transaction-state/transaction-state.ts`                           | 2026-11-14 | AC-2                   |
| `libs/transaction/src/lib/feature-transaction/src/lib/last-transaction/last-transaction-item/last-transaction-item.ts`          | 2026-11-14 | AC-2                   |
| `libs/transaction/src/lib/feature-transaction/src/lib/settings-screen/settings-household-section/settings-household-section.ts` | 2026-11-14 | AC-4                   |
| `libs/transaction/src/lib/feature-transaction/src/lib/settings-screen/settings-screen.ts`                                       | 2026-11-14 | AC-4                   |
| `firestore.rules`                                                                                                               | 2026-11-14 | AC-5                   |
| `apps/budget-fort-e2e/src/multi-user-household.spec.ts`                                                                         | 2026-11-14 | AC-4                   |
