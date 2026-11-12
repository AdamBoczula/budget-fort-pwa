# Spec: Eksport i import danych (Kopia zapasowa i przywracanie)

## Metadata

- **Author:** SDLC Orchestrator & Business Analyst (AI)
- **Date:** 2026-11-11
- **Status:** implemented
- **Domain:** settings

## Cel biznesowy

Umożliwienie użytkownikowi bezpiecznego utworzenia kopii zapasowej (eksport do pliku JSON) oraz przywrócenia danych (import z pliku JSON z pełnym zastąpieniem obecnego stanu) przed zmianą telefonu, przeglądarki lub w celu zarchiwizowania danych domowego budżetu.

---

## Zakres (Scope)

### W scope

1. **Eksport danych do pliku JSON:**
   - Wygenerowanie pliku `.json` zawierającego kompletny stan aplikacji:
     - Metadane (wersja schematu pliku, data eksportu, wersja aplikacji).
     - Transakcje (`transaction`).
     - Kategorie (`category`) i podkategorie (`subcategory`).
     - Budżety (`budget`) i budżety kategorii (`categoryBudget`).
     - Ustawienia użytkownika z LocalStorage (wybrana waluta, motyw).
   - Automatyczne pobranie pliku z nazwą `budget-fort-backup-YYYY-MM-DD.json`.
2. **Import danych z pliku JSON:**
   - Wybór pliku `.json` z dysku użytkownika.
   - **Dwuetapowa walidacja pliku przed importem:**
     - **Etap 1 (Struktura pliku):** Sprawdzenie poprawności parsowania JSON oraz obecności koperty schematu (`schemaVersion`, `data`). W przypadku błędu: komunikat _„Twój plik jest nieprawidłowy”_.
     - **Etap 2 (Walidacja danych):** Sprawdzenie integralności danych wewnątrz kolekcji (poprawność typów, wymagane pola encji np. `amount`, `date`, `id` w transakcjach). W przypadku błędu: komunikat _„Błędne dane w pliku: [szczegóły błędu]”_.
   - Wyświetlenie podsumowania zawartości pliku (liczba transakcji, kategorii, budżetów) przed wykonaniem operacji.
   - **Dialog blokujący / potwierdzenie bezpieczeństwa:**
     - Ostrzeżenie o bezpowrotnym usunięciu i zastąpieniu wszystkich obecnych danych.
     - Wymóg wpisania frazy potwierdzającej (input text):
       - Dla zalogowanego użytkownika: jego adres e-mail (np. `jan@example.com`).
       - Dla gościa (tryb lokalny / guest): `"użytkownik gość"` (wersja PL) lub `"guest user"` (wersja EN).
     - **Styl przycisku potwierdzenia:** Przycisk w kolorze ostrzegawczym (`warn` / ostrzeżenie).
     - Gdy wpisana fraza nie zgadza się: przycisk jest **disabled** (nieaktywny), ale zachowuje kolor ostrzegawczy (`warn`).
     - Gdy wpisana fraza się zgadza: przycisk staje się **enabled** (aktywny), nadal w kolorze ostrzegawczym (`warn`).
   - Wyczyszczenie obecnych tabel w IndexedDB i ustawień w LocalStorage, a następnie wgranie danych z pliku w ramach atomowej transakcji Dexie.
   - Odświeżenie stanu aplikacji i powiadomienie użytkownika o sukcesie.
3. **Lokalizacja w UI:**
   - Nowa sekcja na ekranie Ustawień (`/settings`) o nazwie „Kopia zapasowa i dane” / „Backup & Data”.

### Out of scope

- Eksport/import w formatach CSV, XLSX, XML.
- Scalanie częściowe (Merge) danych z pliku i z bazy – przyjęto regułę pełnego zastąpienia (Overwrite/Restore).
- Automatyczne tworzenie kopii w chmurze (Google Drive, iCloud) poza Firebase Sync.

---

## Use Cases (UC)

### UC-1: Eksport danych do pliku JSON

- **Aktor:** Użytkownik (zalogowany lub gość)
- **Precondition:** Użytkownik znajduje się na ekranie `/settings`.
- **Main flow:**
  1. Użytkownik klika przycisk „Eksportuj dane”.
  2. System pobiera wszystkie rekordy z IndexedDB (`transaction`, `category`, `subcategory`, `budget`, `categoryBudget`) oraz ustawienia z LocalStorage (`BUDGET_FORT_CURRENCY`, `BUDGET_FORT_THEME`).
  3. System generuje obiekt JSON z metadanymi i danymi.
  4. System wyzwala pobieranie pliku w przeglądarce o nazwie `budget-fort-backup-YYYY-MM-DD.json`.
  5. System wyświetla powiadomienie (SnackBar) o pomyślnym wyeksportowaniu danych.
- **Postcondition:** Plik JSON znajduje się na dysku użytkownika.

### UC-2: Import danych z pliku JSON (Ścieżka sukcesu z zabezpieczeniem)

- **Aktor:** Użytkownik (zalogowany lub gość)
- **Precondition:** Użytkownik znajduje się na ekranie `/settings` i posiada prawidłowy plik JSON z kopią zapasową.
- **Main flow:**
  1. Użytkownik klika przycisk „Importuj dane” i wybiera plik `.json`.
  2. System odczytuje plik i przeprowadza dwuetapową walidację (struktura + integralność danych).
  3. System otwiera modal potwierdzenia z podsumowaniem importowanych danych (np. _„Znaleziono: 45 transakcji, 8 kategorii, 2 budżety”_).
  4. Modal informuje, że wszystkie aktualne dane zostaną bezpowrotnie usunięte.
  5. System prezentuje pole tekstowe wymagające wpisania frazy autoryzacyjnej:
     - Jeśli użytkownik jest zalogowany: jego adres e-mail (np. `user@example.com`).
     - Jeśli użytkownik jest gościem: `"użytkownik gość"` (PL) lub `"guest user"` (EN).
  6. Przycisk „Potwierdź i przywróć” jest widoczny w kolorze ostrzegawczym (`warn`) i jest nieaktywny (`disabled`).
  7. Użytkownik wpisuje wymaganą frazę.
  8. Po dopasowaniu frazy przycisk „Potwierdź i przywróć” staje się aktywny (`enabled`), nadal w kolorze ostrzegawczym (`warn`).
  9. Użytkownik klika „Potwierdź i przywróć”.
  10. System w transakcji atomowej czyści IndexedDB, zapisuje nowe dane, aktualizuje LocalStorage.
  11. System zamyka modal, wyświetla powiadomienie o sukcesie i odświeża stan aplikacji / nawiguje do strony głównej.
- **Postcondition:** Baza aplikacji zawiera wyłącznie dane zaimportowane z pliku JSON.

### UC-3: Odrzucenie nieprawidłowego pliku importu (Plik niewłaściwy)

- **Aktor:** Użytkownik
- **Precondition:** Użytkownik próbuje zaimportować plik niebędący prawidłowym JSON lub niemający wymaganej struktury koperty kopii zapasowej.
- **Main flow:**
  1. Użytkownik wybiera plik.
  2. Walidator wykrywa błąd parsowania lub brak wymaganych pól głównych (`schemaVersion`, `data`).
  3. System nie otwiera modalu nadpisywania.
  4. System wyświetla komunikat: _„Twój plik jest nieprawidłowy”_.
- **Postcondition:** Stan bazy danych nie ulega zmianie.

### UC-4: Odrzucenie pliku z błędnymi danymi

- **Aktor:** Użytkownik
- **Precondition:** Użytkownik wybiera plik JSON o prawidłowej strukturze koperty, lecz zawierający uszkodzone rekordy (np. transakcja bez kwoty lub z nieprawidłowym formatem).
- **Main flow:**
  1. Użytkownik wybiera plik.
  2. Walidator wykrywa błędy integralności danych.
  3. System nie otwiera modalu nadpisywania.
  4. System wyświetla komunikat: _„Błędne dane w pliku: [szczegóły, np. brak kwoty w transakcji #2]”_.
- **Postcondition:** Stan bazy danych nie ulega zmianie.

---

## Edge Cases

- **Edge Case 1: Pusta baza podczas eksportu**
  - **Oczekiwane zachowanie:** Eksport tworzy poprawny plik JSON z pustymi tablicami (`transactions: []`, etc.) i aktualnymi kategoriami/ustawieniami.
- **Edge Case 2: Różnice wielkości liter / spacje w polu potwierdzenia**
  - **Oczekiwane zachowanie:** Walidacja ignoruje wiodące i końcowe spacje (`trim()`) oraz wielkość liter (`toLowerCase()`) dla frazy gościa i adresu e-mail.
- **Edge Case 3: Niezgodność wersji schematu**
  - **Oczekiwane zachowanie:** Jeśli `schemaVersion` jest większy niż obsługiwany przez aktualną wersję aplikacji, system traktuje to jako nieobsługiwany plik i wyświetla stosowny komunikat.
- **Edge Case 4: Przerwanie procesu w trakcie importu**
  - **Oczekiwane zachowanie:** Operacje na bazie IndexedDB wykonywane w transakcji Dexie (`db.transaction('rw', ...)`), aby w przypadku błędu nie pozostawić bazy w stanie niespójnym.

---

## Acceptance Criteria (AC)

### AC-1: Eksport danych do pliku JSON

- **Given:** Użytkownik posiada w bazie dane i jest na stronie `/settings`.
- **When:** Użytkownik klika przycisk „Eksportuj dane”.
- **Then:** Przeglądarka pobiera plik `.json` o nazwie pasującej do wzorca `budget-fort-backup-*.json`, a jego zawartość jest poprawnym JSON-em z sekcjami: `schemaVersion`, `exportedAt`, `data: { transactions, categories, subcategories, budgets, categoryBudgets, settings }`.

### AC-2: Blokada importu – nieaktywny przycisk w kolorze ostrzegawczym

- **Given:** Użytkownik wgrał poprawny plik JSON w modalu importu.
- **When:** Pole potwierdzenia jest puste lub zawiera tekst niezgodny z wymaganym.
- **Then:** Przycisk „Potwierdź i przywróć” ma kolor ostrzegawczy (`warn`) i jest wyłączony (`disabled`).

### AC-3: Odblokowanie przycisku potwierdzenia dla gościa

- **Given:** Użytkownik korzysta z aplikacji jako gość w języku polskim.
- **When:** Wpisze w polu potwierdzenia `użytkownik gość` (lub z tolerancją na wielkość liter `Użytkownik gość`).
- **Then:** Przycisk „Potwierdź i przywróć” staje się aktywny (`enabled`) i zachowuje kolor ostrzegawczy (`warn`).

### AC-4: Odblokowanie przycisku potwierdzenia dla zalogowanego użytkownika

- **Given:** Użytkownik jest zalogowany z adresem `test@example.com`.
- **When:** Wpisze w polu potwierdzenia `test@example.com`.
- **Then:** Przycisk „Potwierdź i przywróć” staje się aktywny (`enabled`) i zachowuje kolor ostrzegawczy (`warn`).

### AC-5: Pomyślny import i zastąpienie danych

- **Given:** Użytkownik wpisał poprawne potwierdzenie i kliknął „Potwierdź i przywróć”.
- **When:** Operacja importu dobiega końca.
- **Then:** Dotychczasowe dane w IndexedDB zostają zastąpione danymi z pliku, ustawienia w LocalStorage zostają zaktualizowane, modal zostaje zamknięty, a aplikacja prezentuje komunikat o sukcesie.

### AC-6: Walidacja – plik niewłaściwy

- **Given:** Użytkownik próbuje zaimportować plik niebędący JSON-em lub niemający struktury schematu kopii.
- **When:** System przetwarza plik.
- **Then:** Wyświetlany jest komunikat „Twój plik jest nieprawidłowy”, a baza danych nie zostaje zmodyfikowana.

### AC-7: Walidacja – błędne dane w pliku

- **Given:** Użytkownik próbuje zaimportować plik JSON z nieprawidłowymi/uszkodzonymi rekordami transakcji, kategorii lub budżetów.
- **When:** System przetwarza plik.
- **Then:** Wyświetlany jest komunikat „Błędne dane w pliku: [szczegóły błędu]”, a baza danych nie zostaje zmodyfikowana.

---

## Model danych (Schemat pliku JSON kopii zapasowej)

```typescript
export interface BackupFileEnvelope {
  schemaVersion: 1;
  appVersion?: string;
  exportedAt: string; // ISO 8601 UTC
  data: {
    transactions: Transaction[];
    categories: Category[];
    subcategories: Subcategory[];
    budgets: Budget[];
    categoryBudgets: CategoryBudget[];
    settings: {
      currency: string | null;
      theme: string | null;
    };
  };
}
```

---

## Architektura i Kontrakty (Gate 2)

### 1. Podział odpowiedzialności

1. **Warstwa danych (`libs/shared/local-db`):**
   - `BackupRestoreService`:
     - `exportBackup(): Promise<BackupFileEnvelope>`: odczytuje wszystkie tabele z IndexedDB (`transaction`, `category`, `subcategory`, `budget`, `categoryBudget`) oraz LocalStorage (`BUDGET_FORT_CURRENCY`, `BUDGET_FORT_THEME`) i tworzy obiekt `BackupFileEnvelope`.
     - `validateBackupFile(rawJson: unknown): ValidationResult`: sprawdza strukturę (Etap 1: envelope i schemaVersion) oraz integralność danych (Etap 2: poprawność typów, unikalność ID, wymagane pola).
     - `restoreBackup(backup: BackupFileEnvelope): Promise<void>`: wykonuje atomową transakcję Dexie (`clear()` + `bulkAdd()`), aktualizuje LocalStorage.
2. **Warstwa UI / Prezentacji (`libs/transaction/feature-transaction`):**
   - Komponent sekcji w ustawieniach: `SettingsBackupSectionComponent` w `settings-backup-section/`.
   - Dialog potwierdzenia: `SettingsRestoreConfirmDialogComponent` w `settings-backup-section/confirm-dialog/`.
   - Dialog zawiera input tekstowy, informację o wymaganej frazie, podsumowanie importu oraz przycisk `mat-flat-button color="warn"` (disabled/enabled zgodnie z AC-2, AC-3, AC-4).
   - Integracja z `AuthState` z `@feature-auth` / `@data-access-auth` do pobrania trybu (`isGuest`, `currentUser()?.email`).

---

## Implemented in

| File                                                                                                                                                            | Date       | AC Covered                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------- |
| `libs/shared/local-db/src/lib/backup-restore.types.ts`                                                                                                          | 2026-11-11 | AC-1, AC-5, AC-6, AC-7       |
| `libs/shared/local-db/src/lib/backup-restore.service.ts`                                                                                                        | 2026-11-11 | AC-1, AC-5, AC-6, AC-7       |
| `libs/shared/local-db/src/lib/backup-restore.service.spec.ts`                                                                                                   | 2026-11-11 | AC-1, AC-5, AC-6, AC-7       |
| `libs/transaction/src/lib/feature-transaction/src/lib/settings-screen/settings-backup-section/confirm-dialog/settings-restore-confirm-dialog.component.ts`      | 2026-11-11 | AC-2, AC-3, AC-4             |
| `libs/transaction/src/lib/feature-transaction/src/lib/settings-screen/settings-backup-section/confirm-dialog/settings-restore-confirm-dialog.component.html`    | 2026-11-11 | AC-2, AC-3, AC-4             |
| `libs/transaction/src/lib/feature-transaction/src/lib/settings-screen/settings-backup-section/confirm-dialog/settings-restore-confirm-dialog.component.scss`    | 2026-11-11 | AC-2, AC-3                   |
| `libs/transaction/src/lib/feature-transaction/src/lib/settings-screen/settings-backup-section/confirm-dialog/settings-restore-confirm-dialog.component.spec.ts` | 2026-11-11 | AC-2, AC-3, AC-4             |
| `libs/transaction/src/lib/feature-transaction/src/lib/settings-screen/settings-backup-section/settings-backup-section.component.ts`                             | 2026-11-11 | AC-1, AC-5, AC-6, AC-7       |
| `libs/transaction/src/lib/feature-transaction/src/lib/settings-screen/settings-backup-section/settings-backup-section.component.html`                           | 2026-11-11 | AC-1                         |
| `libs/transaction/src/lib/feature-transaction/src/lib/settings-screen/settings-backup-section/settings-backup-section.component.scss`                           | 2026-11-11 | AC-1                         |
| `libs/transaction/src/lib/feature-transaction/src/lib/settings-screen/settings-backup-section/settings-backup-section.component.spec.ts`                        | 2026-11-11 | AC-1, AC-5, AC-6, AC-7       |
| `libs/transaction/src/lib/feature-transaction/src/lib/settings-screen/settings-screen.ts`                                                                       | 2026-11-11 | AC-1                         |
| `apps/budget-fort/src/locale/messages.en.xlf`                                                                                                                   | 2026-11-11 | AC-1, AC-2, AC-3, AC-6, AC-7 |
| `apps/budget-fort-e2e/src/settings-backup.spec.ts`                                                                                                              | 2026-11-11 | AC-1, AC-2, AC-3             |
