# ADR-007: Dołączanie do Gospodarstwa Domowego poprzez Deep Link (Invite Link)

- **Status:** accepted
- **Date:** 2026-11-16
- **Deciders:** Adam, Antigravity (Architect & BA)
- **Supersedes:** Rozszerza [ADR-005](./005-multi-user-household-data-model.md) (Sekcja Zaproszeń do Gospodarstwa)
- **Superseded by:** —

## Kontekst

W [ADR-005](./005-multi-user-household-data-model.md) wdrożyliśmy współdzielony model danych gospodarstwa domowego (`/households/{householdId}`) oraz 6-znakowy kod zaproszenia (`inviteCode`). Dołączenie drugiego partnera wymagało ręcznego przepisania tego kodu w formularzu ustawień.

Zgodnie z Roadmapą strategiczną (Zadanie P2.1 w `docs/roadmap.md`), proces ten powinien być maksymalnie bezwysiłkowy (frictionless). Użytkownik powinien móc wysłać link zaproszenia (np. komunikatorami WhatsApp/Signal/SMS), a zaproszony partner po jednym kliknięciu dołączyć do wspólnego budżetu.

Wyzwania architektoniczne:
1. **Stan autoryzacji odbiorcy:** Odbiorca może być już zalogowany w aplikacji, nie posiadać konta w ogóle lub korzystać z trybu gościa.
2. **Utrata kontekstu podczas logowania/rejestracji:** Jeśli użytkownik musi przejść procedurę rejestracji i weryfikacji mailowej lub logowania Google, link zaproszenia nie może zginąć w trakcie przekierowań autoryzacyjnych.
3. **PWA / Offline-First:** Aplikacja działa jako PWA na urządzeniach mobilnych, więc trasa `/join` musi być obsłużona natychmiastowo przez Angular Router i integrować się z Web Share API.

## Decyzja

Wdrażamy architekturę **Invite Deep Link z sesyjnym buforem oczekującego zaproszenia**:

### 1. Format Linku Zaproszenia

- Link ma postać: `${origin}/join?code=${inviteCode}` (z kompatybilnością wsteczną na parametr `?invite=`).
- W UI ekranu Ustawień (`SettingsHouseholdSectionComponent`) dodajemy przycisk „Kopiuj link” obok dotychczasowego „Kopiuj kod”.
- Używamy `navigator.share` na wspieranych urządzeniach mobilnych z transparentnym fallbackiem do `navigator.clipboard.writeText`.

### 2. Trasa i Dedykowany Komponent `/join`

- Trasa `/join` jest zarejestrowana na najwyższym poziomie aplikacji w `apps/budget-fort/src/app/app.routes.ts` i nie jest zablokowana przez `authGuard`.
- Za obsługę odpowiada `JoinHouseholdComponent`:
  - Gdy użytkownik jest zalogowany: wywołuje bezpośrednio `SyncEngineService.joinHousehold(code)`, prezentuje informację zwrotną i przekierowuje do aplikacji (`/`).
  - Gdy użytkownik nie jest zalogowany: zapisuje kod w `sessionStorage` pod kluczem `bf_pending_invite_code` i przekierowuje do `/auth/login?returnUrl=/join?code=${code}`.

### 3. Buforowanie w `sessionStorage` i Automatyczne Dołączenie po Logowaniu

- Dlaczego `sessionStorage`, a nie `localStorage`:
  - `sessionStorage` trwa przez czas trwania sesji przeglądarki (wystarczająco na proces logowania/rejestracji).
  - Zapobiega trwałemu "wiszeniu" nieaktualnych kodów, jeśli użytkownik zrezygnuje z dołączenia i wróci za miesiąc jako niezależny użytkownik.
- W `SyncEngineService`:
  - Podczas pierwszego uruchomienia pętli synchronizacji po zalogowaniu (`syncNow()`):
  - Zanim utworzone zostanie nowe, puste gospodarstwo domowe dla nowego użytkownika (`getOrCreateHousehold`), serwis sprawdza obecność kodu w `sessionStorage`.
  - Jeśli kod istnieje: natychmiast wywołuje `joinHousehold(code)`, czyści `sessionStorage` i notyfikuje użytkownika.

### 4. Spójność UI/UX (Anti-UI-Slop)

- Na ekranie `/auth/login` i `/auth/register` pojawia się estetyczny banner informujący, że użytkownik dołącza do zaproszonego gospodarstwa domowego.
- Komponent `/join` posiada stany: ładowania (`mat-spinner`), sukcesu oraz błędu (np. nieprawidłowy/pusty kod, tryb offline).

## Konsekwencje

- **Zalety:**
  - 1-kliknięcie dla domownika, który już korzysta z aplikacji.
  - Zero wpisywania 6-znakowego kodu dla nowego użytkownika — płynny onboarding.
  - Pełna integracja z mechanizmem synchronizacji Firestore z ADR-005.
- **Ryzyka i mitygacja:**
  - *Ryzyko:* Użytkownik wchodzi na stary/błędny link. *Mitygacja:* `JoinHouseholdComponent` i `SyncEngineService` czyszczą `sessionStorage` w przypadku błędu i wyświetlają zrozumiały komunikat z możliwością przejścia do standardowego budżetu.
