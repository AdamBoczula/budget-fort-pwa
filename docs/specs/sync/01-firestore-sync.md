# Spec: Synchronizacja IndexedDB (Dexie) z Cloud Firestore

## Metadata
- **Author:** Adam & Antigravity (Architect & BA)
- **Date:** 2026-11-13
- **Status:** draft
- **Domain:** sync

---

## Cel biznesowy

Zapewnienie zalogowanym użytkownikom aplikacji Budget Fort automatycznej, bezpiecznej i niezauważalnej synchronizacji danych budżetowych w chmurze Cloud Firestore z możliwością pracy na wielu urządzeniach jednocześnie, przy zachowaniu bezwzględnej zasady **Offline-First** (natychmiastowy zapis w lokalnym IndexedDB) oraz poszanowaniu pełnej prywatności użytkowników w trybie Gościa.

---

## Zakres (Scope)

### W scope
1. **Hybrydowa synchronizacja dwukierunkowa:**
   - Push: asynchroniczne wysyłanie lokalnych zmian z kolejki `syncQueue` do Cloud Firestore.
   - Pull: pobieranie zmian z Firestore w oparciu o zapytania delta (`where('updatedAt', '>', lastSyncTimestamp)`).
2. **Kolejka operacji (Outbox Pattern):**
   - Dedykowana tabela `syncQueue` w IndexedDB rejestrująca zdarzenia typu `upsert` i `delete`.
3. **Migracja schematu bazy danych (Dexie v5):**
   - Wprowadzenie pól `updatedAt: string` (ISO 8601), `isDeleted?: boolean`, `deletedAt?: string` dla wszystkich encji.
   - Migracja kluczy numerycznych w tabeli `categoryBudget` i `budget` na unikalne identyfikatory typu `string`.
4. **Rozwiązywanie konfliktów:**
   - Deterministyczna strategia Last-Write-Wins (LWW) bazująca na znacznikach czasu ISO `updatedAt`.
   - Obsługa usunięć jako *Soft Delete* w celu uniknięcia odtwarzania skasowanych danych przez inne węzły.
5. **Obsługa sieci i sesji:**
   - Wykrywanie stanu online/offline (`navigator.onLine` oraz zdarzenia `window.addEventListener('online')`).
   - Wstrzymanie synchronizacji w trybie Gościa (`guestMode`).
   - Opcja importu/scalenia danych lokalnych gościa po zalogowaniu/rejestracji na konto Firebase.
6. **Wskaźnik statusu synchronizacji w UI:**
   - Ikona i etykieta stanu w aplikacji (zsynchronizowano, synchronizowanie w toku, tryb offline, błąd).
7. **Reguły bezpieczeństwa Firebase (`firestore.rules`):**
   - Dostęp ściśle ograniczony do zasobów zalogowanego użytkownika (`request.auth.uid == userId`).

### Out of scope
- Kolaboracja w czasie rzeczywistym między wieloma użytkownikami (współdzielony budżet partnerski) – każdy użytkownik posiada własną, odizolowaną przestrzeń `/users/{userId}`.
- Zewnętrzne serwisy synchronizacji firm trzecich (np. CouchDB, RxDB, Dexie Cloud).
- Automatyczne scalanie konfliktów wewnątrz pojedynczego pola (np. algorytmy diff/patch na treści komentarza).

---

## Use Cases (UC)

### UC-1: Zapis danych w trybie online (Normal Flow)
- **Aktor:** Zalogowany użytkownik z aktywnym połączeniem sieciowym.
- **Precondition:** Użytkownik posiada stan sesji `authenticated`, a wskaźnik sieci wskazuje `online`.
- **Main flow:**
  1. Użytkownik dodaje lub edytuje transakcję w interfejsie.
  2. Serwis domenowy zapisuje encję w IndexedDB z bieżącym czasem `updatedAt` oraz dodaje wpis do tabeli `syncQueue`.
  3. UI natychmiast aktualizuje widok (reaktywny sygnał, zero opóźnienia sieciowego).
  4. `SyncEngineService` wykrywa nowy wpis w kolejce i wysyła paczkę zmian do Cloud Firestore (`writeBatch`).
  5. Po pomyślnym zapisie w Firestore wpis zostaje usunięty z `syncQueue`.
  6. Wskaźnik stanu synchronizacji przyjmuje stan `synced`.
- **Postcondition:** Dane w IndexedDB i Cloud Firestore są spójne.

### UC-2: Zapis danych w trybie offline i automatyczne dosłanie (Offline Flow)
- **Aktor:** Zalogowany użytkownik bez dostępu do Internetu.
- **Precondition:** Użytkownik jest `authenticated`, brak połączenia z siecią (`offline`).
- **Main flow:**
  1. Użytkownik dodaje nową transakcję lub usuwa kategorię.
  2. System zapisuje zmiany w IndexedDB (dla usunięcia: `isDeleted = true`) oraz rejestruje wpis w `syncQueue`.
  3. UI natychmiast odzwierciedla zmianę; wskaźnik pokazuje stan `offline` z liczbą oczekujących zmian.
  4. Po przywróceniu łączności sieciowej system emituje zdarzenie `online`.
  5. `SyncEngineService` automatycznie przetwarza zakolejkowane operacje i wysyła je do Cloud Firestore.
  6. Po opróżnieniu kolejki stan zmienia się na `synced`.
- **Postcondition:** Wszystkie operacje wykonane w trybie offline zostają bezpiecznie zreplikowane do chmury.

### UC-3: Pierwsze logowanie na nowym urządzeniu (Initial Cloud Pull)
- **Aktor:** Użytkownik logujący się na nowym telefonie lub w czystej przeglądarce.
- **Precondition:** Nowe urządzenie posiada pustą bazę IndexedDB; użytkownik pomyślnie uwierzytelnia się kontem Firebase.
- **Main flow:**
  1. Po zakończeniu logowania `SyncEngineService` inicjuje proces `initialPull`.
  2. Pobierane są wszystkie dokumenty użytkownika z kolekcji `/users/{userId}/...` w Firestore.
  3. Dane są hurtowo zapisywane w lokalnym IndexedDB (transakcja Dexie).
  4. Stan `lastSyncTimestamp` zostaje zaktualizowany do czasu serwera.
  5. Widok główny (Dashboard) natychmiast prezentuje kompletny budżet pobrany z chmury.
- **Postcondition:** Nowe urządzenie ma w pełni odtworzone dane użytkownika.

### UC-4: Pobieranie zmian wykonanych na innym urządzeniu (Delta Sync)
- **Aktor:** Zalogowany użytkownik posiadający aplikację otwartą na laptopie.
- **Precondition:** Na telefonie dodano wydatek, który trafił do Firestore.
- **Main flow:**
  1. Aplikacja na laptopie powraca do aktywności (focus okna) lub upływa interwał sprawdzania zmian (polling delta / snapshot listener).
  2. `SyncEngineService` odpytuje Firestore o dokumenty z `updatedAt > lastSyncTimestamp`.
  3. Zwrócone dokumenty są porównywane z lokalną bazą za pomocą reguły LWW.
  4. Jeśli wersja z chmury jest nowsza, lokalny rekord w IndexedDB zostaje zaktualizowany.
  5. UI odświeża stan dashboardu i listę transakcji.
- **Postcondition:** Zmiany z innych urządzeń są zsynchronizowane.

### UC-5: Rejestracja użytkownika z lokalnymi danymi Gościa (Guest Data Merge)
- **Aktor:** Użytkownik, który korzystał z aplikacji jako Gość, a teraz tworzy konto.
- **Precondition:** W lokalnej bazie istnieją transakcje wprowadzone w trybie `guest`.
- **Main flow:**
  1. Użytkownik przechodzi proces rejestracji lub logowania Google.
  2. System wykrywa, że lokalna baza zawiera dane gościa i pyta: *"Czy chcesz zachować dotychczasowe dane i zsynchronizować je ze swoim nowym kontem?"*.
  3. Po potwierdzeniu system generuje wpisy w `syncQueue` dla wszystkich istniejących lokalnych rekordów.
  4. `SyncEngineService` przesyła dane do chmury użytkownika.
  5. Tryb gościa zostaje wyłączony, a dane są bezpiecznie zsynchronizowane.
- **Postcondition:** Dane gościa stają się danymi przypisanymi do konta w chmurze.

---

## Edge Cases

- **Edge Case 1: Równoczesna edycja tego samego rekordu na dwóch urządzeniach offline.**
  - **Zachowanie:** Przy powrocie online wygrywa wersja o późniejszym znaczniku `updatedAt` (Last-Write-Wins). Żaden rekord nie zostaje uszkodzony, a stan w chmurze i na obu urządzeniach dąży do spójności ostatecznej (*eventual consistency*).
- **Edge Case 2: Wylogowanie użytkownika na współdzielonym urządzeniu.**
  - **Zachowanie:** Przed wylogowaniem `SyncEngineService` upewnia się, że `syncQueue` jest pusta (lub ostrzega o niesynchronizowanych zmianach). Po potwierdzeniu wylogowania baza lokalna IndexedDB może zostać wyczyszczona lub zablokowana do ponownego zalogowania danego użytkownika, zapobiegając wyciekowi danych do kolejnego profilu.
- **Edge Case 3: Błąd sieci w trakcie wysyłki paczki do Firestore.**
  - **Zachowanie:** Elementy w `syncQueue` zachowują licznik `retryCount`. Silnik stosuje algorytm Exponential Backoff i ponawia próbę po określonym czasie, nie gubiąc żadnych transakcji.
- **Edge Case 4: Usunięcie kategorii, która na innym urządzeniu otrzymała nową transakcję.**
  - **Zachowanie:** Dzięki *Soft Delete* kategoria pozostaje w bazie z flagą `isDeleted = true`. Relacja nie zostaje zerwana, a transakcja na drugim urządzeniu nie powoduje błędu integralności klucza obcego.

---

## Acceptance Criteria (AC)

### AC-1: Natychmiastowy zapis lokalny (Offline-First Guarantee)
- **Given:** Użytkownik jest zalogowany i dodaje transakcję, a urządzenie nie ma połączenia z siecią.
- **When:** Użytkownik zatwierdza formularz transakcji.
- **Then:** Transakcja zostaje natychmiast zapisana w tabeli `transaction` IndexedDB, formularz zamyka się bez żadnego opóźnienia, a w tabeli `syncQueue` pojawia się wpis z operacją `upsert`.

### AC-2: Automatyczna wysyłka po powrocie do sieci
- **Given:** W tabeli `syncQueue` znajdują się 3 oczekujące operacje, a aplikacja była offline.
- **When:** Przeglądarka zgłasza zdarzenie `online`.
- **Then:** `SyncEngineService` automatycznie wysyła oczekujące operacje do Firestore wsadem (`writeBatch`), po czym usuwa je z `syncQueue` i ustawia stan `synced`.

### AC-3: Rozstrzyganie konfliktów LWW (Last-Write-Wins)
- **Given:** Transakcja o ID `TX-1` ma w lokalnym IndexedDB `updatedAt: 2026-11-13T12:00:00Z`, a w chmurze pojawiła się wersja z `updatedAt: 2026-11-13T12:05:00Z`.
- **When:** Następuje synchronizacja delta (pull).
- **Then:** Wersja lokalna w IndexedDB zostaje zaktualizowana danymi z chmury.

### AC-4: Poprawność Soft Delete
- **Given:** Użytkownik usuwa wydatek w aplikacji.
- **When:** Następuje usunięcie encji.
- **Then:** Rekord w IndexedDB zostaje oznaczony jako `isDeleted: true` z aktualnym `deletedAt` oraz `updatedAt`, operacja trafia do `syncQueue`, a po zsynchronizowaniu z chmurą rekord w Firestore również ma flagę `isDeleted: true`.

### AC-5: Izolacja w trybie Gościa
- **Given:** Użytkownik korzysta z aplikacji w trybie Gościa (`guestMode = true`).
- **When:** Użytkownik wykonuje jakiekolwiek operacje CRUD na budżecie i transakcjach.
- **Then:** `SyncEngineService` nie wykonuje żadnych zapytań sieciowych do Firebase, a wskaźnik stanu pokazuje tryb lokalny.

### AC-6: Migracja kluczy budżetu na string UUID
- **Given:** Schemat bazy danych zostaje podbity do wersji 5.
- **When:** Aplikacja inicjalizuje `LocalDbService`.
- **Then:** Wszystkie rekordy w tabeli `categoryBudget` oraz `budget` posiadają klucze `id` typu `string`, a operacje zapisu i powiązania działają poprawnie.

### AC-7: Kontrola limitów zapytań (Delta Sync)
- **Given:** Użytkownik posiada 1000 transakcji w historii, a od ostatniej synchronizacji zmieniły się 2 transakcje.
- **When:** Uruchamiana jest cykliczna lub manualna synchronizacja delta.
- **Then:** Zapytanie do Firestore pobiera wyłącznie 2 zmienione dokumenty (`where('updatedAt', '>', lastSyncTimestamp)`), zamiast odczytywać całą kolekcję 1000 rekordów.

### AC-8: Widoczność statusu w UI
- **Given:** Użytkownik znajduje się na dowolnym ekranie aplikacji.
- **When:** Zmienia się stan synchronizacji (np. z `syncing` na `synced` lub `offline`).
- **Then:** Komponent wskaźnika w UI odzwierciedla aktualny stan odpowiednią ikoną i komunikatem dostępnym również dla czytników ekranu (aria-live).

---

## Model danych i Migracja Dexie (Wersja 5)

### Nowe pola bazowe dla każdej encji (`SyncableEntity`)
```typescript
export interface SyncableEntity {
  id: string;
  updatedAt: string;     // ISO 8601 UTC
  isDeleted?: boolean;   // true jeśli rekord usunięty
  deletedAt?: string;    // ISO 8601 UTC
}
```

### Zaktualizowany model Budżetów
```typescript
export interface Budget extends SyncableEntity {
  id: string;            // 'default' (zamiast dotychczasowego number 1)
  amount: number;
}

export interface CategoryBudget extends SyncableEntity {
  id: string;            // UUID (zamiast dotychczasowego auto-increment number)
  categoryId: string;
  categoryName: string;
  amount: number;
}
```

### Tabela kolejki `syncQueue`
```typescript
export interface SyncQueueRecord {
  id: string;                     // UUID wpisu w kolejce
  store: 'transaction' | 'category' | 'subcategory' | 'budget' | 'categoryBudget';
  entityId: string;
  operation: 'upsert' | 'delete';
  payload: any;
  createdAt: string;              // ISO 8601 UTC
  retryCount: number;
  lastError?: string;
}
```

### Konfiguracja Store w Dexie (`LocalDbService` v5):
```typescript
export const BUDGET_FORT_DB_VERSION = 5;

export const BUDGET_FORT_DB_STORES_V5 = {
  transaction: 'id,date,categoryId,accountId,subcategory,updatedAt,isDeleted',
  category: 'id,sortOrder,isHidden,name,updatedAt,isDeleted',
  subcategory: 'id,categoryId,name,updatedAt,isDeleted',
  budget: 'id,updatedAt,isDeleted',
  categoryBudget: 'id,categoryId,updatedAt,isDeleted',
  syncQueue: 'id,store,entityId,createdAt,retryCount',
};
```

---

## UI / UX

### Wskaźnik stanu synchronizacji (`SyncStatusComponent`)

| Stan | Ikona | Komunikat | Kolor/Styl |
| :--- | :--- | :--- | :--- |
| **Synced** | `cloud_done` | Dane zsynchronizowane | Zielony / Subtelny |
| **Syncing** | `sync` (animacja obrotu) | Trwa synchronizacja... | Niebieski / Aktywny |
| **Offline** | `cloud_off` | Tryb offline (X zmian w kolejce) | Szary / Ostrzegawczy |
| **Error** | `sync_problem` | Błąd synchronizacji (Kliknij, aby ponowić) | Czerwony / Alert |
| **Guest** | `person_outline` | Tryb lokalny (tylko na tym urządzeniu) | Szary |

---

## Architektura i Podział Modułów

```
libs/sync/
  ├── data-access-sync/
  │    ├── services/
  │    │    ├── sync-engine.service.ts       # Koordynator Push & Pull
  │    │    ├── sync-queue.service.ts        # Zarządzanie tabelą syncQueue
  │    │    ├── firestore-sync.service.ts    # Komunikacja z Cloud Firestore
  │    │    └── network-status.service.ts    # Detekcja online/offline
  │    ├── state/
  │    │    └── sync.state.ts                # Stan reaktywny (Signals)
  │    └── types/
  │         └── sync.types.ts                # Typy i interfejsy
  └── ui-sync/
       └── sync-status/
            ├── sync-status.component.ts     # Prezentacyjny widget stanu
            └── sync-status.component.scss   # BEM + Angular Material
```

---

## Task Board

| # | Task | Status | Assignee | Notes |
|---|------|--------|----------|-------|
| 1 | Migracja schematu Dexie do v5 (pola audytowe, tabela `syncQueue`, migracja ID budżetów) | ✅ Done | Dev | `libs/shared/local-db` |
| 2 | Utworzenie biblioteki `libs/sync/data-access-sync` (struktura Nx) | ✅ Done | Dev | `@budget-fort/data-access-sync` |
| 3 | Implementacja `NetworkStatusService` i `SyncQueueService` z testami jednostkowymi | ✅ Done | Dev | Vitest (10 testów) |
| 4 | Implementacja `FirestoreSyncService` (operacje wsadowe `writeBatch`, query delta) | ✅ Done | Dev | Firebase SDK modular (3 testy) |
| 5 | Implementacja `SyncEngineService` (algorytm LWW, obsługa Push i Pull, retry) | ✅ Done | Dev | Sygnały + RxJS (4 testy) |
| 6 | Utworzenie reguł bezpieczeństwa `firestore.rules` i konfiguracji Firebase | ✅ Done | DevOps/Sec | Subagent `firestore-rules-author` |
| 7 | Utworzenie komponentu UI `SyncStatusComponent` w `libs/sync/ui-sync` | ✅ Done | UI/Dev | Anti-UI-Slop, BEM, a11y (5 testów) |
| 8 | Integracja z widokiem głównym (Header aplikacji) i kolejkowaniem w repozytoriach | ✅ Done | Dev | Toolbar i Store'y |
| 9 | Testy jednostkowe i integracyjne scenariuszy offline/online i LWW | ✅ Done | Tester | Wszystkie testy (122 testy) przechodzą |
| 10 | Weryfikacja jakościowa całości (`nx build budget-fort`, linting) | ✅ Done | QA | Build i lint bez błędów |

---

## Implemented in

| Plik | Data | AC pokryte |
|------|------|------------|
| `firestore.rules` | 2026-11-13 | AC-1, AC-5 |
| `firebase.json` | 2026-11-13 | Konfiguracja Firestore |
| `libs/shared/local-db/src/lib/local-db.ts` | 2026-11-13 | AC-1, AC-6 |
| `libs/shared/local-db/src/lib/local-db.spec.ts` | 2026-11-13 | AC-1, AC-6 |
| `libs/shared/local-db/src/lib/sync.types.ts` | 2026-11-13 | AC-1, AC-6 |
| `libs/budget/data-access-budget/src/lib/model/budget.type.ts` | 2026-11-13 | AC-6 |
| `libs/budget/data-access-budget/src/lib/model/category-budget.type.ts` | 2026-11-13 | AC-6 |
| `libs/budget/data-access-budget/src/lib/services/category-budget.service.ts` | 2026-11-13 | AC-1, AC-6 |
| `libs/budget/data-access-budget/src/lib/services/budget.service.ts` | 2026-11-13 | AC-1, AC-6 |
| `libs/transaction/src/lib/data-access-transaction/src/lib/data-access-transaction/model/transaction.type.ts` | 2026-11-13 | AC-4, AC-6 |
| `libs/transaction/src/lib/data-access-transaction/src/lib/data-access-transaction/model/category.type.ts` | 2026-11-13 | AC-4, AC-6 |
| `libs/transaction/src/lib/data-access-transaction/src/lib/data-access-transaction/model/subcategory.type.ts` | 2026-11-13 | AC-4, AC-6 |
| `libs/transaction/src/lib/data-access-transaction/src/lib/data-access-transaction/transaction/transaction-store.ts` | 2026-11-13 | AC-1, AC-4 |
| `libs/transaction/src/lib/data-access-transaction/src/lib/data-access-transaction/category/category-store.ts` | 2026-11-13 | AC-1, AC-4 |
| `libs/sync/data-access-sync/src/lib/services/network-status.service.ts` | 2026-11-13 | AC-2 |
| `libs/sync/data-access-sync/src/lib/services/network-status.service.spec.ts` | 2026-11-13 | AC-2 |
| `libs/sync/data-access-sync/src/lib/services/sync-queue.service.ts` | 2026-11-13 | AC-1, AC-2 |
| `libs/sync/data-access-sync/src/lib/services/sync-queue.service.spec.ts` | 2026-11-13 | AC-1, AC-2 |
| `libs/sync/data-access-sync/src/lib/state/sync.state.ts` | 2026-11-13 | AC-8 |
| `libs/sync/data-access-sync/src/lib/state/sync.state.spec.ts` | 2026-11-13 | AC-8 |
| `libs/sync/data-access-sync/src/lib/services/firestore-sync.service.ts` | 2026-11-13 | AC-2, AC-4, AC-7 |
| `libs/sync/data-access-sync/src/lib/services/firestore-sync.service.spec.ts` | 2026-11-13 | AC-2, AC-4, AC-7 |
| `libs/sync/data-access-sync/src/lib/services/sync-engine.service.ts` | 2026-11-13 | AC-2, AC-3, AC-5, AC-7 |
| `libs/sync/data-access-sync/src/lib/services/sync-engine.service.spec.ts` | 2026-11-13 | AC-2, AC-3, AC-5, AC-7 |
| `libs/sync/ui-sync/src/lib/sync-status/sync-status.component.ts` | 2026-11-13 | AC-8 |
| `libs/sync/ui-sync/src/lib/sync-status/sync-status.component.scss` | 2026-11-13 | AC-8 |
| `libs/sync/ui-sync/src/lib/sync-status/sync-status.component.spec.ts` | 2026-11-13 | AC-8 |
| `libs/transaction/src/lib/ui-transaction/src/lib/ui-transaction/transaction-header-toolbar.component.ts` | 2026-11-13 | AC-8 |
| `libs/transaction/src/lib/ui-transaction/src/lib/ui-transaction/transaction-header-toolbar.component.scss` | 2026-11-13 | AC-8 |
| `apps/budget-fort/src/locale/messages.en.xlf` | 2026-11-13 | i18n sync strings |



---

## Zależności

- `libs/shared/local-db`: definicja schematu bazy Dexie i serwis bazodanowy.
- `libs/auth/data-access-auth`: dostarczenie tożsamości użytkownika (`AuthState`, `currentUser.uid`, `isGuest`).
- Firebase Cloud Firestore: SDK modular v13 (`firebase/firestore`).
