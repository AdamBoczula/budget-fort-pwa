# Roadmap & Future Strategic Decisions

Ten dokument podsumowuje strategiczne kierunki rozwoju aplikacji **Budget Fort**, ustalone decyzje architektoniczne, priorytety wdrożeniowe oraz elementy odrzucone lub odłożone na później.

Data sporządzenia: 2026-11-14

---

## 1. Model Gospodarstwa Domowego i Synchronizacja (Multi-user)

- **Koncepcja:** Aplikacja działa w oparciu o wspólne gospodarstwo domowe (`householdId`), a nie tylko pojedynczego użytkownika. Wiele osób z domowników może w tym samym czasie rejestrować lub modyfikować wydatki i budżety.
- **Zaproszenia i dołączanie przez bezpośredni link (Deep Link / Invite Link):**
  - **Mechanizm:** Zamiast ręcznego przepisywania 6-znakowego kodu, użytkownik może skopiować gotowy link zaproszenia (np. `https://budget-fort.app/join?code=ABC123` lub z parametrem query `?invite=ABC123`).
  - **UX dla zaproszonego:**
    - Jeśli użytkownik jest już zalogowany: natychmiastowe potwierdzenie i dołączenie do gospodarstwa.
    - Jeśli użytkownik nie jest zalogowany: kod zaproszenia jest zapamiętywany (w `sessionStorage`), użytkownik przechodzi logowanie/rejestrację, a po sukcesie zostaje automatycznie przypisany do zapraszającego gospodarstwa bez ponownego wpisywania kodu.
- **Rozwiązywanie konfliktów:**
  - **Przyjęta strategia:** **Field-level Last-Write-Wins (LWW)** w oparciu o stempel czasu `updatedAt`.
  - **Dlaczego:** Wpisywanie wydatków to w >95% operacje dopisywania (append-only). Równoczesna edycja tego samego wpisu zdarza się marginalnie rzadko.
  - **Ekran/modal rozwiązywania konfliktów w UI:** **Odrzucony na tym etapie.** Zamiast blokujących modali i skomplikowanego diffowania pól przy kasie w sklepie, zachowujemy automatyczny merge LWW. Jeśli w przyszłości powstaną realne problemy z nadpisywaniem danych, temat zostanie wznowiony (np. w postaci asynchronicznego logu aktywności).
- **Identyfikacja danych:**
  - Każda transakcja i budżet będą posiadać powiązanie z `householdId` oraz opcjonalnie `authorId`.

---

## 2. Transakcje Rekurencyjne (np. stałe comiesięczne opłaty)

- **Koncepcja:** Możliwość oznaczenia wydatku/przychodu jako powtarzalnego (na ten moment: interwał miesięczny, np. czynsz, subskrypcje, media).
- **Architektura (Offline-First):**
  - Model reguły rekurencji w bazie (np. `RecurringTransactionRule`).
  - **Generowanie wpisów na startup aplikacji:**
    - Podczas uruchamiania (`APP_INITIALIZER` lub serwis domenowy) aplikacja porównuje datę `lastGeneratedMonth` z aktualnym miesiącem.
    - Brakujące instancje transakcji są dopisywane bezpośrednio do IndexedDB i oznaczane do synchronizacji z chmurą.
  - **Dlaczego nie Service Worker:** Service Worker na urządzeniach mobilnych (zwłaszcza iOS Safari) jest usypiany w tle i nie ma gwarancji obudzenia 1. dnia miesiąca bez otwarcia aplikacji. Startup w IndexedDB jest w 100% deterministyczny, prosty i działa w pełni offline.

---

## 3. Aktualizacje aplikacji (Deployments) i Automatyczna Instalacja

- **Koncepcja:** Płynne wdrażanie nowych wersji bez negatywnego wpływu na UX oraz automatyczna instalacja nowej wersji u użytkowników bez konieczności ręcznego czyszczenia pamięci podręcznej.
- **Problem braku automatycznej aktualizacji:**
  - Przeglądarka z Service Workerem domyślnie trzyma pliki w pamięci podręcznej (Cache-First) i nie aktywuje nowego workera w locie, jeśli otwarta jest jakakolwiek karta aplikacji.
- **Wdrożona i rozwijana strategia:**
  - **PWA Service Worker (`@angular/service-worker` + `ngsw-config.json`):** Automatyczne hashowanie plików buildu i precyzyjne odświeżanie assetów.
  - **Brak automatycznego wylogowywania:** Wylogowanie po deployu zostało **odrzucone** (użytkownik PWA oczekuje stałej sesji, a w trybie offline nie mógłby się ponownie zalogować).
  - **Obsługa cyklu życia nowej wersji:**
    - Powiadomienie Snackbar (`VERSION_READY`) z przyciskiem _„Zaktualizuj”_ podczas aktywnej pracy.
    - Automatyczne ciche przeładowanie/aktywacja przy ponownym otwarciu lub powrocie do aplikacji (np. po przełączeniu aplikacji na telefonie).
  - **Prace konserwacyjne / Banner w chmurze (Maintenance Banner):**
    - Dokument w Firestore (`/app_config/maintenance`) nasłuchiwany w czasie rzeczywistym.
    - Informowanie z wyprzedzeniem o oknach serwisowych w chmurze z uspokojeniem, że tryb offline działa nieprzerwanie.

---

## 4. Warunki Użytkowania (Terms of Use) i Polityka Prywatności

- **Koncepcja:** Przejrzystość prawna i budowa zaufania w aplikacji finansowej.
- **Rozróżnienie trybów działania:**
  - **Tryb Lokalny (Offline / Gość):** Zero przetwarzania danych osobowych poza urządzeniem, brak komunikacji z serwerem, pełna prywatność lokalna w IndexedDB.
  - **Tryb Synchronizacji (Chmura / Gospodarstwo):** Przejrzysta klauzula RODO / GDPR informująca o celu przetwarzania (przechowywanie UID, e-maila i danych budżetowych w Firebase w celu współdzielenia między domownikami).
- **Realizacja:** Dedykowane modale / zakładki w procesie logowania i ustawień profilu.

---

## 5. Analityka (Google Analytics / Alternatywy Privacy-Friendly)

- **Koncepcja:** Zrozumienie sposobu korzystania z funkcji bez naruszania prywatności finansowej.
- **Zasady zbierania danych:**
  - **Ścisła anonimizacja:** Kategoryczny brak zbierania kwot transakcji, sald, nazw własnych czy danych finansowych.
  - **Metryki zdarzeniowe:** Wyłącznie zdarzenia behawioralne (np. `transaction_created`, `budget_viewed`, `filter_changed`).
  - Zgodność z Consent Mode v2 / RODO.

---

## 6. Monetyzacja i Koszty Utrzymania

- **Bannery reklamowe (AdSense itp.):** **Całkowicie odrzucone.**
  - _Powody:_ Bardzo niski przychód przy małej/średniej skali (< kilkanaście zł/mc), negatywny wpływ na zaufanie w aplikacji finansowej, brak działania w trybie offline, degradacja wydajności i UX.
- **Alternatywny model w przyszłości:**
  - Podstawowy budżet lokalny za darmo na zawsze.
  - Opcjonalny model dobrowolnego wsparcia ("Kup kawę autorowi") lub mikrosubskrypcja na pokrycie kosztów chmury przy synchronizacji wieloosobowej.

---

## 7. Landing Page

- **Status:** **Odłożony w czasie.**
- **Założenie:** Zostanie zrealizowany dopiero po ustabilizowaniu funkcji gospodarstwa domowego (multi-user) i gdy aplikacja będzie gotowa na otwarcie dla użytkowników zewnętrznych.

---

## Tabela Priorytetów

| Faza           | Zadanie                                 | Status                                           | Opis                                                                                                                                                                                                                                                                   |
| :------------- | :-------------------------------------- | :----------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P1**         | **Transakcje rekurencyjne**             | ✅ Zrealizowano (2026-11-14)                     | Definicja reguł, deterministyczne generowanie instancji (`rec_${ruleId}_${YYYY-MM}`) w IndexedDB przy starcie aplikacji (offline-first).                                                                                                                               |
| **P2**         | **Multi-user (`householdId`)**          | ✅ Zrealizowano (2026-11-14)                     | Podział danych na gospodarstwa domowe, synchronizacja Firebase `/households/{householdId}`, LWW. Zobacz [Spec](specs/sync/02-multi-user-household.md) i [ADR-005](adr/005-multi-user-household-data-model.md).                                                         |
| **P2.1**       | **Zaproszenia do Household przez Link** | ✅ Zrealizowano (2026-11-16)                     | Generowanie linku z kodem (`/join?code=...`), auto-logowanie / auto-join po autoryzacji zaproszonej osoby bez ręcznego wpisywania kodu. Zobacz [Spec](specs/sync/03-household-invite-link.md) i [ADR-007](adr/007-household-invite-deep-link.md). |
| **P3**         | **Zarządzanie aktualizacjami & Banner** | ✅ Zrealizowano (2026-11-15)                     | PWA Service Worker (`@angular/service-worker`), powiadomienie `SwUpdate` z opcją przeładowania, banner informacyjny o planowanych pracach. Zobacz [Spec](specs/pwa/01-app-update-and-maintenance-banner.md) i [ADR-006](adr/006-pwa-update-and-maintenance-banner.md). |
| **P4**         | **Regulamin & Polityka prywatności**    | Ekrany informacyjne dla trybu offline vs online. |
| **P5**         | **Privacy-first Analytics**             | Anonimowe zdarzenia bez danych kwotowych.        |
| **Przyszłość** | **Landing Page**                        | Promocja i pozyskiwanie użytkowników.            |
