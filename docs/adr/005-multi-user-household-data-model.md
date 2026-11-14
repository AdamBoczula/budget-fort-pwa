# ADR-005: Model Danych Gospodarstwa Domowego (Household) i Synchronizacja Wieloużytkownikowa

- **Status:** accepted
- **Date:** 2026-11-14
- **Deciders:** Adam, Antigravity (Architect & BA)
- **Supersedes:** Częściowo uzupełnia i rozszerza [ADR-004](./004-firestore-hybrid-sync-and-offline-first.md) (przejście ze ścieżki `/users/{userId}` na `/households/{householdId}`)
- **Superseded by:** —

## Kontekst

Dotychczasowa implementacja synchronizacji Firestore ([ADR-004](./004-firestore-hybrid-sync-and-offline-first.md)) zakładała ściśle odizolowaną przestrzeń danych per użytkownik (`/users/{userId}/*`).
Zgodnie z ustaloną wizją strategiczną aplikacji **Budget Fort** ([Roadmapa: Faza P2](../../docs/roadmap.md)), kluczowym wyróżnikiem produktu ma być możliwość prowadzenia wspólnego budżetu domowego przez partnerów / domowników (współdzielenie transakcji, limitów budżetowych i kategorii wydatków).

Pojawia się potrzeba:

1. Zdefiniowania relacji wieloużytkownikowej (Household $\leftrightarrow$ Members).
2. Wydzielenia wspólnej przestrzeni danych w Cloud Firestore (`/households/{householdId}/*`) przy zachowaniu pełnej zasady **Offline-First**.
3. Identyfikacji autora wpisów (`authorId` / `authorName`) w transakcjach dla przejrzystości, kto zarejestrował dany wydatek/przychód.
4. Rozwiązywania współbieżnych edycji w modelu **Field-level Last-Write-Wins (LWW)** w oparciu o znacznik czasu `updatedAt`, bez wprowadzania blokujących modali konfliktów w UI (zgodnie z decyzją strategiczną w Roadmapie).
5. Zapewnienia bezpiecznych reguł `firestore.rules` uniemożliwiających nieuprawnionym osobom odczyt i modyfikację budżetu danego gospodarstwa domowego.
6. Płynnego startu nowego użytkownika (automatyczne utworzenie gospodarstwa domowego lub dołączenie za pomocą prostego kodu/zaproszenia).

## Decyzja

Wybieramy **Model Gospodarstwa Domowego opartego o `householdId` z dynamicznym członkostwem w Firestore**:

### 1. Struktura Dokumentów i Kolekcji w Cloud Firestore

1. **Metadane Użytkownika:**
   - Ścieżka: `/users/{userId}`
   - Pola: `uid`, `email`, `displayName`, `currentHouseholdId`, `updatedAt`
   - Cel: Przechowuje informację, do którego gospodarstwa domowego aktualnie należy użytkownik.

2. **Kolekcja Gospodarstw Domowych:**
   - Ścieżka: `/households/{householdId}`
   - Pola:
     - `id`: string (identyfikator gospodarstwa)
     - `name`: string (np. "Budżet Domowy", domyślnie "Moje Gospodarstwo")
     - `ownerUid`: string (UID założyciela)
     - `members`: string[] (tablica UID użytkowników należących do gospodarstwa – optymalizacja pod Security Rules)
     - `inviteCode`: string (6-znakowy unikalny kod ułatwiający dołączenie drugiego partnera)
     - `createdAt`, `updatedAt`: ISO 8601 string
     - `isDeleted`: boolean

3. **Współdzielone dane gospodarstwa domowego (Subkolekcje pod `/households/{householdId}/`):**
   - `/households/{householdId}/transaction/{transactionId}`
   - `/households/{householdId}/category/{categoryId}`
   - `/households/{householdId}/subcategory/{subcategoryId}`
   - `/households/{householdId}/budget/{budgetId}`
   - `/households/{householdId}/categoryBudget/{categoryBudgetId}`
   - `/households/{householdId}/recurringRule/{ruleId}`

### 2. Rozszerzenie Modelu Danych (Dexie v7 i Encje TypeScript)

1. Każda encja dziedzicząca po `SyncableEntity` otrzymuje opcjonalne pole `householdId?: string`.
2. Encja `Transaction` otrzymuje pole `authorId?: string` oraz opcjonalnie `authorName?: string`.
3. Tabela `syncQueue` oraz `SyncEngineService` synchronizują dane ze ścieżką `/households/{currentHouseholdId}/*` zamiast dotychczasowego `/users/{userId}/*`.
4. Tryb Gościa (`guestMode`): lokalne dane posiadają `householdId = 'local'`. Podczas rejestracji lub dołączenia do gospodarstwa, dane gościa mogą zostać bezkonfliktowo przypisane do nowego `householdId`.

### 3. Field-Level Last-Write-Wins (LWW)

Podczas operacji Pull (`Delta Sync`):

- Jeśli lokalny rekord istnieje i jest nowszy (`local.updatedAt > remote.updatedAt`), lokalny rekord ma pierwszeństwo.
- Jeśli zdalny dokument jest nowszy, pola rekordu są aktualizowane z zachowaniem pól niezmienionych.
- Ponieważ >95% operacji domowych to dopisywanie nowych wydatków (`append-only`), konflikt równoczesnej edycji dokładnie tego samego rekordu jest minimalny i deterministycznie rozwiązywany bez przerywania pracy użytkownika przy kasie.

### 4. Firestore Security Rules

Uprawnienia sprawdzane są w oparciu o tablicę `members` dokumentu gospodarstwa domowego:

```text
function isHouseholdMember(householdId) {
  return isAuthenticated() &&
    request.auth.uid in get(/databases/$(database)/documents/households/$(householdId)).data.members;
}
```

Zapewnia to bezpieczną izolację – tylko aktywni członkowie gospodarstwa domowego mogą odczytywać i zapisywać transakcje i budżety tego gospodarstwa.

## Rozważane alternatywy

### Alternatywa 1: Pokoje w czasie rzeczywistym z WebRTC / CRDT (Yjs)

- **Opis:** Ciągła synchronizacja p2p lub CRDT przy użyciu bibliotek typu Yjs.
- **Dlaczego odrzucono:** Nadmiarowa złożoność architektoniczna, duży narzut na wagę bundle'a PWA, zbędny przy domowym budżecie, gdzie operacje to w znakomitej większości niezależne transakcje (append-only).

### Alternatywa 2: Oddzielne subkolekcje `/users/{userId}/...` ze współdzielonymi linkami odczytu

- **Opis:** Dane pozostają w przestrzeni jednego użytkownika, a partner otrzymuje uprawnienia gościa do jego kolekcji.
- **Dlaczego odrzucono:** Niesymetryczne relacje (kto jest właścicielem bazy, jak rozliczać usuwanie konta), trudniejsze reguły `firestore.rules` i zapytania złożone.

## Konsekwencje

### Pozytywne

- **Prawdziwy budżet domowy:** Partnerzy mogą równolegle wprowadzać paragony, a budżet i wykresy kategorii uwzględniają wydatki obu osób.
- **Przejrzystość:** Wiadomo, kto zarejestrował dany wydatek (`authorId`).
- **Niezmienna zasada Offline-First:** Wszystkie operacje nadal natychmiast trafiają do lokalnego IndexedDB.
- **Prosty UX:** Brak frustrujących ekranów rozwiązywania konfliktów w sklepie – LWW działa transparentnie.

### Negatywne / Do monitorowania

- Konieczność odczytu dokumentu `/households/{householdId}` w regułach bezpieczeństwa Firebase (`get()` konsumuje 1 odczyt Firestore per batch). Optymalizacja reguł cache'uje odczyty w ramach pojedynczego żądania.
- Migracja schematu Dexie do wersji 7 (dodanie indeksu `householdId` do tabel).
