# Roadmap & Future Strategic Decisions

Ten dokument podsumowuje strategiczne kierunki rozwoju aplikacji **Budget Fort**, ustalone decyzje architektoniczne, priorytety wdrożeniowe oraz elementy odrzucone lub odłożone na później.

Data sporządzenia: 2026-11-14

---

## 1. Model Gospodarstwa Domowego i Synchronizacja (Multi-user)

* **Koncepcja:** Aplikacja działa w oparciu o wspólne gospodarstwo domowe (`householdId`), a nie tylko pojedynczego użytkownika. Wiele osób z domowników może w tym samym czasie rejestrować lub modyfikować wydatki i budżety.
* **Rozwiązywanie konfliktów:**
  * **Przyjęta strategia:** **Field-level Last-Write-Wins (LWW)** w oparciu o stempel czasu `updatedAt`.
  * **Dlaczego:** Wpisywanie wydatków to w >95% operacje dopisywania (append-only). Równoczesna edycja tego samego wpisu zdarza się marginalnie rzadko.
  * **Ekran/modal rozwiązywania konfliktów w UI:** **Odrzucony na tym etapie.** Zamiast blokujących modali i skomplikowanego diffowania pól przy kasie w sklepie, zachowujemy automatyczny merge LWW. Jeśli w przyszłości powstaną realne problemy z nadpisywaniem danych, temat zostanie wznowiony (np. w postaci asynchronicznego logu aktywności).
* **Identyfikacja danych:**
  * Każda transakcja i budżet będą posiadać powiązanie z `householdId` oraz opcjonalnie `authorId`.

---

## 2. Transakcje Rekurencyjne (np. stałe comiesięczne opłaty)

* **Koncepcja:** Możliwość oznaczenia wydatku/przychodu jako powtarzalnego (na ten moment: interwał miesięczny, np. czynsz, subskrypcje, media).
* **Architektura (Offline-First):**
  * Model reguły rekurencji w bazie (np. `RecurringTransactionRule`).
  * **Generowanie wpisów na startup aplikacji:**
    * Podczas uruchamiania (`APP_INITIALIZER` lub serwis domenowy) aplikacja porównuje datę `lastGeneratedMonth` z aktualnym miesiącem.
    * Brakujące instancje transakcji są dopisywane bezpośrednio do IndexedDB i oznaczane do synchronizacji z chmurą.
  * **Dlaczego nie Service Worker:** Service Worker na urządzeniach mobilnych (zwłaszcza iOS Safari) jest usypiany w tle i nie ma gwarancji obudzenia 1. dnia miesiąca bez otwarcia aplikacji. Startup w IndexedDB jest w 100% deterministyczny, prosty i działa w pełni offline.

---

## 3. Aktualizacje aplikacji (Deployments) i Komunikacja z Użytkownikiem

* **Koncepcja:** Płynne wdrażanie nowych wersji bez negatywnego wpływu na UX.
* **Przyjęta strategia:**
  * **Brak automatycznego wylogowywania:** Wylogowanie po deployu zostało **odrzucone** (użytkownik PWA oczekuje stałej sesji, a w trybie offline nie mógłby się ponownie zalogować).
  * **Standardowe powiadomienie PWA:** Poinformowanie o nowej wersji za pomocą banera/Snackbara (obsługa przez `@angular/service-worker` i `SwUpdate`) z opcją przeładowania.
  * **Prace konserwacyjne / Duże wdrożenia (Breaking Changes):**
    * Planowane na godziny nocne.
    * Wprowadzenie mechanizmu powiadomień/bannera informacyjnego w aplikacji przed planowaną przerwą/wdrożeniem.
    * Wymuszone wylogowanie stosowane wyłącznie w wyjątkowych sytuacjach krytycznych migracji schematu autoryzacji.

---

## 4. Warunki Użytkowania (Terms of Use) i Polityka Prywatności

* **Koncepcja:** Przejrzystość prawna i budowa zaufania w aplikacji finansowej.
* **Rozróżnienie trybów działania:**
  * **Tryb Lokalny (Offline / Gość):** Zero przetwarzania danych osobowych poza urządzeniem, brak komunikacji z serwerem, pełna prywatność lokalna w IndexedDB.
  * **Tryb Synchronizacji (Chmura / Gospodarstwo):** Przejrzysta klauzula RODO / GDPR informująca o celu przetwarzania (przechowywanie UID, e-maila i danych budżetowych w Firebase w celu współdzielenia między domownikami).
* **Realizacja:** Dedykowane modale / zakładki w procesie logowania i ustawień profilu.

---

## 5. Analityka (Google Analytics / Alternatywy Privacy-Friendly)

* **Koncepcja:** Zrozumienie sposobu korzystania z funkcji bez naruszania prywatności finansowej.
* **Zasady zbierania danych:**
  * **Ścisła anonimizacja:** Kategoryczny brak zbierania kwot transakcji, sald, nazw własnych czy danych finansowych.
  * **Metryki zdarzeniowe:** Wyłącznie zdarzenia behawioralne (np. `transaction_created`, `budget_viewed`, `filter_changed`).
  * Zgodność z Consent Mode v2 / RODO.

---

## 6. Monetyzacja i Koszty Utrzymania

* **Bannery reklamowe (AdSense itp.):** **Całkowicie odrzucone.**
  * *Powody:* Bardzo niski przychód przy małej/średniej skali (< kilkanaście zł/mc), negatywny wpływ na zaufanie w aplikacji finansowej, brak działania w trybie offline, degradacja wydajności i UX.
* **Alternatywny model w przyszłości:**
  * Podstawowy budżet lokalny za darmo na zawsze.
  * Opcjonalny model dobrowolnego wsparcia ("Kup kawę autorowi") lub mikrosubskrypcja na pokrycie kosztów chmury przy synchronizacji wieloosobowej.

---

## 7. Landing Page

* **Status:** **Odłożony w czasie.**
* **Założenie:** Zostanie zrealizowany dopiero po ustabilizowaniu funkcji gospodarstwa domowego (multi-user) i gdy aplikacja będzie gotowa na otwarcie dla użytkowników zewnętrznych.

---

## Tabela Priorytetów

| Faza | Zadanie | Status | Opis |
| :--- | :--- | :--- | :--- |
| **P1** | **Transakcje rekurencyjne** | ✅ Zrealizowano (2026-11-14) | Definicja reguł, deterministyczne generowanie instancji (`rec_${ruleId}_${YYYY-MM}`) w IndexedDB przy starcie aplikacji (offline-first). |
| **P2** | **Multi-user (`householdId`)** | ⏳ Kolejny krok | Podział danych na gospodarstwa, synchronizacja Firebase, algorytm LWW na polach. |
| **P3** | **Zarządzanie aktualizacjami & Banner** | PWA `SwUpdate`, banner informacyjny o planowanych pracach. |
| **P4** | **Regulamin & Polityka prywatności** | Ekrany informacyjne dla trybu offline vs online. |
| **P5** | **Privacy-first Analytics** | Anonimowe zdarzenia bez danych kwotowych. |
| **Przyszłość** | **Landing Page** | Promocja i pozyskiwanie użytkowników. |
