# Spec: Dołączanie do Gospodarstwa Domowego poprzez Link (Household Invite Deep Link)

## Metadata

- **Author:** Adam & Antigravity (SDLC Orchestrator, BA & Architect)
- **Date:** 2026-11-16
- **Status:** implemented
- **Domain:** sync | auth | transaction

---

## Cel biznesowy

Uproszczenie procesu współdzielenia budżetu domowego z partnerem/domownikiem poprzez eliminację konieczności ręcznego przepisywania 6-znakowego kodu zaproszenia. Użytkownik może wygenerować i skopiować gotowy link zaproszenia (np. `https://budget-fort.app/join?code=BF89X2`), a odbiorca po otwarciu linku zostaje natychmiast dołączony do gospodarstwa (gdy jest zalogowany) lub po zalogowaniu/rejestracji (kod jest automatycznie zapamiętywany w `sessionStorage` i aplikowany bez ponownej interakcji).

---

## Zakres (Scope)

### W scope

1. **Generowanie i udostępnianie linku zaproszenia (Ekran Ustawień / Gospodarstwo Domowe):**
   - Dodanie przycisku „Kopiuj link” obok przycisku „Kopiuj kod” w sekcji gospodarstwa domowego (`SettingsHouseholdSectionComponent`).
   - Konstrukcja linku w formacie: `${window.location.origin}/join?code=${inviteCode}` (lub obsługa parametru `invite`).
   - Integracja z Web Share API (`navigator.share`), a w przypadku braku wsparcia fallback do `navigator.clipboard.writeText`.
   - Powiadomienie użytkownika poprzez `MatSnackBar` o pomyślnym skopiowaniu linku.

2. **Obsługa trasy `/join` (Deep Link / Router):**
   - Utworzenie trasy publicznej `/join` w `apps/budget-fort/src/app/app.routes.ts`.
   - Komponent dedykowany `JoinHouseholdComponent` w `@feature-auth`:
     - Odczyt parametru `code` lub `invite` z query string.
     - Walidacja kodu (normalizacja do wielkich liter, trim).
     - Obsługa brakującego lub niepoprawnego parametru zaproszenia (komunikat błędu + przyciski nawigacji).

3. **Przepływ dla użytkownika zalogowanego (Authenticated Flow):**
   - Natychmiastowe wywołanie `SyncEngineService.joinHousehold(code)`.
   - W przypadku sukcesu: powiadomienie użytkownika (`MatSnackBar`) oraz automatyczne przekierowanie na ekran główny (`/`).
   - W przypadku, gdy użytkownik jest już członkiem tego gospodarstwa: informacja zwrotna i przekierowanie bez zbędnych błędów.
   - W przypadku błędu (nieistniejący kod / brak sieci): czytelny stan błędu w UI z możliwością ponowienia próby lub przejścia do aplikacji.

4. **Przepływ dla użytkownika niezalogowanego (Unauthenticated / Guest Flow):**
   - Zapisanie kodu zaproszenia w `sessionStorage` pod kluczem `bf_pending_invite_code`.
   - Przekierowanie na ekran logowania `/auth/login?returnUrl=/join?code=${code}`.
   - Wyświetlenie w ekranie logowania/rejestracji wyróżnionego banneru informacyjnego: „Zostałeś zaproszony do gospodarstwa domowego. Zaloguj się lub utwórz konto, aby dołączyć.”
   - Po pomyślnym uwierzytelnieniu (login email/hasło, logowanie Google lub rejestracja + weryfikacja):
     - `SyncEngineService` lub resolver sesji wykrywa oczekujący kod w `sessionStorage`.
     - Automatycznie wykonuje dołączenie do gospodarstwa (`joinHousehold`).
     - Usuwa kod z `sessionStorage` i wyświetla potwierdzenie (`MatSnackBar`).
     - Przekierowuje użytkownika do aplikacji.

5. **Dostępność i Jakość (Anti-UI-Slop & i18n):**
   - Komponenty z osobnym plikiem `.scss`, BEM, Material Design.
   - Wszystkie teksty interfejsu opatrzone znacznikami `i18n="@@..."` oraz dodane do `messages.en.xlf`.
   - Odpowiednie stany widoku: `loading`, `error`, `success`.

### Out of scope

- Kody jednorazowe z czasem wygaśnięcia TTL w Firestore (kody zaproszeń gospodarstwa są stałe per household, zdefiniowane w ADR-005).
- Wysyłanie zaproszeń mailem bezpośrednio z backendu/Firebase Functions (użytkownik kopiuje link i wysyła go dowolnym komunikatorem, np. WhatsApp, Signal, SMS).
- Zarządzanie rolami członków wewnątrz linku (wszyscy domownicy mają równe uprawnienia).

---

## Use Cases (UC)

### UC-1: Kopiowanie linku zaproszenia przez właściciela gospodarstwa

- **Aktor:** Zalogowany użytkownik w swoim gospodarstwie domowym.
- **Precondition:** Użytkownik znajduje się w Ustawieniach $\rightarrow$ Gospodarstwo Domowe.
- **Main flow:**
  1. Użytkownik widzi swój kod zaproszenia oraz przycisk „Kopiuj link”.
  2. Klika „Kopiuj link”.
  3. System generuje link URL `${origin}/join?code=${inviteCode}` i kopiuje go do schowka.
  4. System wyświetla snackbar: „Link zaproszenia skopiowany do schowka!”.
- **Postcondition:** Link znajduje się w schowku systemowym użytkownika, gotowy do przesłania partnerowi.

### UC-2: Otwarcie linku przez zalogowanego partnera

- **Aktor:** Zalogowany użytkownik (Partner).
- **Precondition:** Użytkownik otrzymał link `https://budget-fort.app/join?code=BF89X2` i otwiera go w przeglądarce.
- **Main flow:**
  1. Przeglądarka ładuje trasę `/join?code=BF89X2`.
  2. Komponent `JoinHouseholdComponent` sprawdza stan autoryzacji — użytkownik jest zalogowany.
  3. Komponent wyświetla wskaźnik postępu („Dołączanie do gospodarstwa domowego...”).
  4. Wywoływane jest `syncEngine.joinHousehold('BF89X2')`.
  5. Dane współdzielonego gospodarstwa są pobierane do lokalnego IndexedDB.
  6. Wyświetlany jest komunikat sukcesu, a użytkownik zostaje przekierowany na pulpit (`/`).
- **Postcondition:** Partner jest członkiem gospodarstwa domowego i widzi wspólny budżet.

### UC-3: Otwarcie linku przez nowego / niezalogowanego partnera

- **Aktor:** Niezalogowany odbiorca linku (lub użytkownik w trybie gościa).
- **Precondition:** Otrzymano link `https://budget-fort.app/join?code=BF89X2`.
- **Main flow:**
  1. Użytkownik otwiera link `/join?code=BF89X2`.
  2. Komponent `JoinHouseholdComponent` wykrywa brak aktywnej autoryzacji Firebase.
  3. Kod `BF89X2` zostaje zapisany w `sessionStorage` (`bf_pending_invite_code`).
  4. Użytkownik zostaje przekierowany do `/auth/login`.
  5. Na ekranie logowania pojawia się banner z informacją o zaproszeniu do gospodarstwa.
  6. Użytkownik loguje się (np. przez Google lub email/hasło).
  7. Po zalogowaniu system pobiera kod z `sessionStorage`, wywołuje `joinHousehold('BF89X2')` i czyści wpis w pamięci sesji.
  8. Wyświetla się snackbar z potwierdzeniem dołączenia, a użytkownik trafia na pulpit (`/`).
- **Postcondition:** Nowy użytkownik dołącza do gospodarstwa bezpośrednio po pierwszym zalogowaniu bez ręcznego wpisywania kodu.

---

## Edge Cases

1. **Użytkownik już należy do zapraszającego gospodarstwa:**
   - **Oczekiwane zachowanie:** System wykrywa, że `currentHousehold().inviteCode === code` (lub `members.includes(uid)`) i informuje: „Należysz już do tego gospodarstwa domowego”, po czym przekierowuje na pulpit bez błędu.
2. **Niepoprawny lub nieistniejący kod zaproszenia w linku:**
   - **Oczekiwane zachowanie:** Komponent `JoinHouseholdComponent` wyświetla komunikat błędu z informacją, że kod jest nieprawidłowy, oraz przycisk pozwalający przejść na stronę główną lub spróbować ponownie. Kod w `sessionStorage` jest usuwany, aby nie blokować kolejnych logowań.
3. **Brak parametru `code` i `invite` w URL `/join`:**
   - **Oczekiwane zachowanie:** Wyświetlenie widoku błędu „Brak kodu zaproszenia w linku” z linkiem do ekranu głównego.
4. **Brak połączenia z siecią (offline) w momencie otwarcia linku:**
   - **Oczekiwane zachowanie:** Informacja „Dołączenie do gospodarstwa wymaga połączenia z internetem” wraz z przyciskiem „Spróbuj ponownie”.
5. **Użytkownik wybiera tryb Gościa po otwarciu linku zaproszenia:**
   - **Oczekiwane zachowanie:** Tryb gościa nie obsługuje synchronizacji chmurowej ani gospodarstw domowych. W ekranie logowania pojawia się jasna informacja, że współdzielenie wymaga konta. Jeśli użytkownik kliknie „Używaj lokalnie”, kod zaproszenia w `sessionStorage` zostaje wyczyszczony, a użytkownik trafia do trybu gościa.

---

## Acceptance Criteria (AC)

### AC-1: Przycisk kopiowania linku w Ustawieniach

- **Given:** Zalogowany użytkownik w sekcji Ustawienia $\rightarrow$ Gospodarstwo Domowe.
- **When:** Klika przycisk „Kopiuj link” (`data-testid="copy-invite-link-btn"`).
- **Then:** Do schowka trafia URL w formacie `${window.location.origin}/join?code=${inviteCode}`, a na ekranie pojawia się `MatSnackBar` potwierdzający skopiowanie.

### AC-2: Natychmiastowe dołączenie zalogowanego użytkownika

- **Given:** Użytkownik jest zalogowany w aplikacji.
- **When:** Otwiera w przeglądarce trasę `/join?code=VALID_CODE`.
- **Then:** System automatycznie dołącza użytkownika do gospodarstwa, czyści ewentualny oczekujący kod, wyświetla powiadomienie sukcesu i nawiguje na `/`.

### AC-3: Zapamiętanie kodu w `sessionStorage` dla niezalogowanego użytkownika

- **Given:** Użytkownik nie jest zalogowany (brak sesji Firebase).
- **When:** Otwiera w przeglądarce trasę `/join?code=VALID_CODE`.
- **Then:** Kod zaproszenia zostaje zapisany w `sessionStorage` pod kluczem `bf_pending_invite_code`, a użytkownik zostaje przekierowany do `/auth/login`.

### AC-4: Banner zaproszenia na ekranie logowania

- **Given:** W `sessionStorage` znajduje się zapisany kod `bf_pending_invite_code`.
- **When:** Użytkownik znajduje się na ekranie `/auth/login` lub `/auth/register`.
- **Then:** Wyświetla się widoczny banner informacyjny z ikoną `group_add`, oznajmiający zaproszenie do gospodarstwa.

### AC-5: Automatyczne dołączenie po udanym logowaniu

- **Given:** W `sessionStorage` znajduje się oczekujący kod zaproszenia `bf_pending_invite_code`.
- **When:** Użytkownik pomyślnie loguje się (email/hasło lub Google) albo weryfikuje konto.
- **Then:** `SyncEngineService` wykrywa oczekujący kod, dołącza użytkownika do gospodarstwa domowego, usuwa wpis z `sessionStorage` i wyświetla powiadomienie o sukcesie.

### AC-6: Obsługa błędnego lub pustego linku

- **Given:** Użytkownik wchodzi na `/join` bez parametru kodu lub z nieistniejącym kodem `INVALID`.
- **When:** Widok `/join` przetwarza żądanie.
- **Then:** Wyświetlany jest czytelny komunikat błędu oraz przycisk powrotu do aplikacji, a aplikacja nie ulega awarii.

---

## Architektura i Kontrakty

### Nowe / Zmodyfikowane Komponenty i Serwisy

1. **`JoinHouseholdComponent` (`libs/auth/feature-auth/src/lib/join-household/`):**
   - Ścieżka URL: `/join` (w `apps/budget-fort/src/app/app.routes.ts`).
   - Reaguje na query parametry: `code` oraz `invite`.
   - Obsługuje stany: `checking`, `joining`, `error`, `success`.
   - Zgodny z Anti-UI-Slop: inline template, `join-household.component.scss` (BEM), Angular Material (`mat-card`, `mat-spinner`, `mat-button`, `mat-icon`).

2. **`HouseholdInviteStorage` (zarządzanie kluczem w `sessionStorage`):**
   - Stała: `BF_PENDING_INVITE_CODE_KEY = 'bf_pending_invite_code'`.
   - Metody pomocnicze w `@data-access-sync`:
     - `getPendingInviteCode(): string | null`
     - `setPendingInviteCode(code: string): void`
     - `clearPendingInviteCode(): void`
     - `buildInviteUrl(inviteCode: string): string`

3. **`SettingsHouseholdSectionComponent` (`@feature-transaction`):**
   - Dodanie metody `copyInviteLink()` oraz przycisku `copy-invite-link-btn`.
   - Wykorzystanie `buildInviteUrl` do wygenerowania pełnego adresu.

4. **`SyncEngineService` (`@data-access-sync`):**
   - W metodzie `syncNow()` (lub przy starcie sesji autoryzowanej):
     - Sprawdzenie `getPendingInviteCode()`.
     - Jeśli istnieje: wykonanie `await this.joinHousehold(pendingCode)` przed inicjalizacją domyślnego gospodarstwa.
     - Czyszczenie kodu po sukcesie lub błędzie krytycznym, z notyfikacją użytkownika.

5. **`LoginComponent` & `RegisterComponent` (`@feature-auth`):**
   - Prezentacja banneru informacyjnego `pendingInviteBanner` gdy w `sessionStorage` obecny jest oczekujący kod.

---

## Task Board

| #   | Task                                                                                    | Status  | Assignee          | Notes                                                                                       |
| --- | --------------------------------------------------------------------------------------- | ------- | ----------------- | ------------------------------------------------------------------------------------------- |
| 1   | Przygotowanie specyfikacji i ADR-007                                                    | ✅ Done | BA / Architect    | `docs/specs/sync/03-household-invite-link.md`, `docs/adr/007-household-invite-deep-link.md` |
| 2   | Utilities / Storage dla Pending Invite w `data-access-sync`                             | ✅ Done | Senior Dev        | `getPendingInviteCode`, `setPendingInviteCode`, `buildInviteUrl`                            |
| 3   | Aktualizacja `SettingsHouseholdSectionComponent` (przycisk Kopiuj link)                 | ✅ Done | Senior Dev        | `copy-invite-link-btn`, obsługa `navigator.share` / `clipboard`                             |
| 4   | Utworzenie `JoinHouseholdComponent` w `@feature-auth` + trasa `/join` w `app.routes.ts` | ✅ Done | Senior Dev        | Obsługa zalogowanych/niezalogowanych, stany błędu i sukcesu                                 |
| 5   | Auto-dołączanie w `SyncEngineService` po autoryzacji                                    | ✅ Done | Senior Dev        | Rozwiązanie oczekującego kodu z `sessionStorage`                                            |
| 6   | Banner zaproszenia w `LoginComponent` i `RegisterComponent`                             | ✅ Done | UI/UX / Dev       | Material styling, Anti-UI-Slop, i18n                                                        |
| 7   | Tłumaczenia i18n w `messages.en.xlf`                                                    | ✅ Done | Senior Dev        | Klucze `@@settingsHousehold.copyLinkBtn`, `@@joinHousehold.*`, `@@auth.pendingInviteBanner` |
| 8   | Testy jednostkowe i integracyjne (Vitest)                                               | ✅ Done | Senior Dev        | Testy `JoinHouseholdComponent`, `SettingsHouseholdSectionComponent`, `SyncEngineService`    |
| 9   | Test E2E Playwright (`household-invite-link.spec.ts`)                                   | ✅ Done | Automation Tester | Ścieżka logged-in i unauthenticated join                                                    |
| 10  | Quality Gate Verification                                                               | ✅ Done | QA Gatekeeper     | `npm exec nx affected -t lint test build e2e`                                               |

---

## Implemented in

| Plik                                                                                                                            | Data       | AC pokryte                         |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------- |
| `libs/sync/data-access-sync/src/lib/utils/invite-link.utils.ts`                                                                 | 2026-11-16 | AC-1, AC-3                         |
| `libs/transaction/src/lib/feature-transaction/src/lib/settings-screen/settings-household-section/settings-household-section.ts` | 2026-11-16 | AC-1                               |
| `libs/auth/feature-auth/src/lib/join-household/join-household.component.ts`                                                     | 2026-11-16 | AC-2, AC-3, AC-6                   |
| `apps/budget-fort/src/app/app.routes.ts`                                                                                        | 2026-11-16 | AC-2, AC-3                         |
| `libs/sync/data-access-sync/src/lib/services/sync-engine.service.ts`                                                            | 2026-11-16 | AC-2, AC-5                         |
| `libs/auth/feature-auth/src/lib/login/login.component.ts`                                                                       | 2026-11-16 | AC-4                               |
| `libs/auth/feature-auth/src/lib/register/register.component.ts`                                                                 | 2026-11-16 | AC-4                               |
| `apps/budget-fort/src/locale/messages.en.xlf`                                                                                   | 2026-11-16 | AC-1, AC-2, AC-4                   |
| `apps/budget-fort-e2e/src/household-invite-link.spec.ts`                                                                        | 2026-11-16 | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6 |
