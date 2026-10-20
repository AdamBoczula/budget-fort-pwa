# Spec Template

Ten plik jest szablonem dla nowych specyfikacji. Kopiuj go i wypełniaj dla każdego
nowego feature'a.

```markdown
# Spec: [Nazwa feature'a]

## Metadata
- **Author:** [imię]
- **Date:** [YYYY-MM-DD]
- **Status:** draft | confirmed | implemented
- **Domain:** transaction | category | reporting | pwa | settings

## Cel biznesowy

[Jedno zdanie opisujące co użytkownik osiągnie po wdrożeniu tego feature'a]

## Zakres (Scope)

### W scope
- [Pozycja 1]
- [Pozycja 2]
- [Pozycja 3]

### Out of scope
- [Pozycja 1]
- [Pozycja 2]

## Use Cases (UC)

Każdy use case opisuje jedną ścieżkę interakcji użytkownika z systemem.

### UC-1: [Nazwa przypadku użycia]

- **Aktor:** Użytkownik
- **Precondition:** [Co musi być prawdą przed rozpoczęciem]
- **Main flow:**
  1. Użytkownik [akcja]
  2. System [reakcja]
  3. Użytkownik [akcja]
  4. System [reakcja]
- **Postcondition:** [Co jest prawdą po zakończeniu]

### UC-2: [Nazwa przypadku użycia]

- **Aktor:** Użytkownik
- **Precondition:** [Co musi być prawdą przed rozpoczęciem]
- **Main flow:**
  1. ...
  2. ...
- **Postcondition:** [Co jest prawdą po zakończeniu]

## Edge Cases

Każdy edge case opisuje nietypową sytuację i oczekiwane zachowanie.

- **Edge Case 1:** [Opis sytuacji]
  - **Oczekiwane zachowanie:** [Co system powinien zrobić]

- **Edge Case 2:** [Opis sytuacji]
  - **Oczekiwane zachowanie:** [Co system powinien zrobić]

## Acceptance Criteria (AC)

Każde AC jest testowalne – Given/When/Then.

### AC-1: [Nazwa kryterium]

- **Given:** [Warunek początkowy – np. użytkownik jest na stronie głównej, baza zawiera 5 transakcji]
- **When:** [Akcja – np. użytkownik klika przycisk "Dodaj transakcję"]
- **Then:** [Rezultat – np. otwiera się formularz z pustymi polami]

### AC-2: [Nazwa kryterium]

- **Given:** [Warunek początkowy]
- **When:** [Akcja]
- **Then:** [Rezultat]

## Model danych (jeśli dotyczy)

```typescript
// Opis nowych lub zmienionych typów / interfejsów
type ExampleType = {
  field1: string;
  field2: number;
  field3?: string;
};
```

- **Walidacja:** [Zasady walidacji dla każdego pola]

## UI / UX (jeśli dotyczy)

### Stany komponentu

| Stan | Opis | Zachowanie |
|------|------|------------|
| Loading | [Kiedy występuje] | [Co widać – skeleton, spinner] |
| Empty | [Kiedy występuje] | [Co widać – komunikat "brak danych"] |
| Error | [Kiedy występuje] | [Co widać – komunikat błędu, retry] |
| Success | [Kiedy występuje] | [Co widać – dane] |

### Interakcje

- [Opis interakcji użytkownika – kliknięcie, swipe, formularz]

## Offline behavior (jeśli dotyczy)

- **Tryb offline:** [Co się dzieje gdy brak sieci]
  - [Zachowanie – np. dane zapisywane lokalnie, kolejkowane]
- **Powrót online:** [Co się dzieje po powrocie sieci]
  - [Zachowanie – np. synchronizacja, stan pozostaje bez zmian]

## Architektura (wypełniane przez Architekta)

### Dotknięte moduły

| Moduł | Plik | Zmiana |
|-------|------|--------|
| `@feature-transaction` | `libs/.../file.ts` | Nowy komponent |
| `@data-access-transaction` | `libs/.../file.ts` | Nowa metoda w serwisie |
| `local-db` | — | Bez zmian |

### Flow danych

```
[Komponent A] --event--> [Facade] --call--> [Service] --write--> [IndexedDB]
     ↑                                                       |
     └───────────────── read ◄───────────────────────────────┘
```

### Task Board (wypełniany przez Developera)

Śledzenie postępu implementacji. Każdy task przechodzi przez statusy:
⬜ **TODO** → 🔄 **In Progress** → ✅ **Done**

| # | Task | Status | Assignee | Notes |
|---|------|--------|----------|-------|
| 1 | [np. dodać typ w data-access] | ⬜ TODO | Dev | — |
| 2 | [np. dodać metodę w serwisie] | ⬜ TODO | Dev | — |
| 3 | [np. stworzyć komponent] | ⬜ TODO | Dev | — |
| 4 | [np. dodać testy jednostkowe] | ⬜ TODO | Dev | — |
| 5 | [np. dodać testy E2E] | ⬜ TODO | QA | — |
| 6 | [np. walidacja quality gate] | ⬜ TODO | QA | `npm exec nx affected -t lint test build e2e` |

## Implemented in (wypełniane po implementacji)

| Plik | Data | AC pokryte |
|------|------|------------|
| `libs/.../file.ts` | 2026-10-15 | AC-1, AC-2 |
| `libs/.../file.spec.ts` | 2026-10-15 | AC-1, AC-2 |
| `apps/budget-fort-e2e/src/.../file.spec.ts` | 2026-10-15 | AC-1 |

## Zależności

- [Istniejący moduł/serwis który będzie użyty]
- [Powiązany spec: `docs/specs/.../other-spec.md`]

## Otwarte pytania (wypełniane przez Analityka)

- [Pytanie 1 – do decyzji użytkownika]
- [Pytanie 2 – do decyzji użytkownika]
```