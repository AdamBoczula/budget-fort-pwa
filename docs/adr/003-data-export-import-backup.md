# ADR-003: Eksport i import danych (Kopia zapasowa w formacie JSON)

- **Status:** accepted
- **Date:** 2026-11-11
- **Deciders:** aboczula (PO), SDLC Team

## Kontekst

Użytkownicy aplikacji Budget Fort (offline-first PWA opartej o IndexedDB i LocalStorage) potrzebują możliwości zrobienia kopii zapasowej przed zmianą urządzenia lub przeglądarki oraz jej odtworzenia.

## Decyzja

1. **Format pliku:** Pełny snapshot w jednym pliku JSON (`budget-fort-backup-YYYY-MM-DD.json`) z wersjonowaną kopertą (`schemaVersion: 1`).
2. **Lokalizacja logiki danych:** Nowy serwis `BackupRestoreService` w `libs/shared/local-db`.
   - `local-db` jest centralną biblioteką danych, która posiada dostęp do tokenów wszystkich tabel Dexie (`transaction`, `category`, `subcategory`, `budget`, `categoryBudget`) oraz serwisu `LocalStorageService`.
   - Wykonywanie operacji odtworzenia w atomowej transakcji Dexie (`db.transaction('rw', ...)`).
3. **Dwuetapowa walidacja:**
   - Etap 1: Sprawdzenie poprawności parsowania JSON oraz obecności pól głównych koperty. Błąd: komunikat _„Twój plik jest nieprawidłowy”_.
   - Etap 2: Sprawdzenie poprawności i kompletności rekordów encji. Błąd: komunikat _„Błędne dane w pliku: [szczegóły]”_.
4. **Bezpieczeństwo i potwierdzenie zastąpienia:**
   - Wyświetlenie modalu potwierdzenia z podsumowaniem importowanych rekordów.
   - Wymóg wpisania frazy (e-mail użytkownika lub `"użytkownik gość"` / `"guest user"`).
   - Przycisk potwierdzenia z kolorem ostrzegawczym (`warn`), nieaktywny dopóki wpisana fraza nie jest zgodna.
5. **Lokalizacja w interfejsie:**
   - Nowa sekcja `SettingsBackupSectionComponent` w ekranie `/settings` (`libs/transaction/feature-transaction`).

## Konsekwencje

- **Pozytywne:**
  - Bezpieczne i bezstratne przenoszenie stanu aplikacji między przeglądarkami i urządzeniami.
  - Ochrona przed przypadkowym zniszczeniem danych dzięki wymuszonemu wpisaniu frazy i stylowi ostrzegawczemu.
  - Czysta separacja odpowiedzialności – logika bazy w `local-db`, UI w `feature-transaction`.
- **Negatywne / Ograniczenia:**
  - Brak automatycznego łączenia częściowego (merge) – import zastępuje całą bazę (zamierzone z punktu widzenia prostoty i spójności offline-first).
