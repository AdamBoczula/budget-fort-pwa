# Spec: App Update Management & Maintenance Banner (Zarządzanie aktualizacjami & Banner)

## Metadata

- **Author:** Business Analyst & SDLC Orchestrator
- **Date:** 2026-11-15
- **Status:** implemented
- **Domain:** pwa | settings

---

## Cel biznesowy

Zapewnienie płynnego, bezstresowego procesu wdrażania i aktualizacji aplikacji Budget Fort w środowisku PWA oraz mechanizmu informowania użytkowników o planowanych oknach serwisowych lub krytycznych zmianach (np. migracji schematów), z poszanowaniem zasady offline-first i bez wymuszania ponownego logowania.

---

## Zakres (Scope)

### W scope

1. **Konfiguracja Service Workera (`@angular/service-worker`):**
   - Włączenie i konfiguracja `provideServiceWorker` w `apps/budget-fort`.
   - Zdefiniowanie reguł buforowania zasobów (`ngsw-config.json`) dla wersji produkcyjnej (pliki statyczne, fonty, ikony).
2. **Serwis wykrywania aktualizacji (`PwaUpdateService`):**
   - Nasłuchiwanie zdarzeń `SwUpdate.versionUpdates` (zdarzenie typu `VERSION_READY`).
   - Sprawdzanie dostępności nowej wersji przy starcie aplikacji oraz okresowo (np. co 6 godzin, gdy aplikacja jest aktywna i online).
3. **Powiadomienie o dostępnej aktualizacji (UI):**
   - Prezentacja nienarzucającego się komunikatu (np. `MatSnackBar` lub dyskretny pasek toast) z tekstem _"Dostępna jest nowa wersja aplikacji"_ oraz akcją _"Odśwież"_.
   - Użytkownik sam decyduje, kiedy odświeżyć aplikację – brak wymuszonego natychmiastowego przeładowania w trakcie wypełniania formularzy czy pracy z budżetem.
4. **Mechanizm komunikacji o pracach konserwacyjnych (Maintenance Banner):**
   - Komponent banera informacyjnego na górze widoku (`MaintenanceBannerComponent`), wyświetlający istotne ogłoszenia (np. planowane okno serwisowe Firestore, duże wdrożenie).
   - Źródło danych: kolekcja systemowa Firestore `/system_announcements` (lub plik konfiguracyjny/Remote Config w przypadku braku połączenia).
   - Możliwość ukrycia banera przez użytkownika (zapis id ogłoszenia w `localStorage`, aby nie pojawiało się ponownie w ramach tej samej sesji/wersji).
5. **Trwałość sesji i offline:**
   - Aktualizacja aplikacji nie wylogowuje użytkownika (`localStorage` i sesja Firebase Auth zostają zachowane).
   - W trybie offline aplikacja działa w pełni na bazie wcześniej zapisanego cache i IndexedDB.

### Out of scope

1. Automatyczne, wymuszone wylogowywanie użytkowników po wdrożeniu (odrzucone w Roadmapie, poza absolutnie wyjątkowymi incydentami bezpieczeństwa).
2. Blokowanie działania aplikacji offline podczas prac konserwacyjnych w chmurze (lokalny budżet w IndexedDB pozostaje zawsze dostępny; wstrzymana może być jedynie synchronizacja).
3. Panel CMS dla administratora do publikacji ogłoszeń w UI (ogłoszenia serwisowe konfigurowane bezpośrednio w bazie Firebase / konsoli).

---

## Use Cases (UC)

### UC-1: Powiadomienie o nowej wersji i aktualizacja aplikacji

- **Aktor:** Użytkownik
- **Precondition:** Użytkownik korzysta z zainstalowanej aplikacji PWA lub wersji webowej, na serwerze pojawiło się nowe wydanie.
- **Main flow:**
  1. Service Worker pobiera w tle nowy pakiet aplikacji.
  2. `SwUpdate` emituje zdarzenie `VERSION_READY`.
  3. Aplikacja wyświetla powiadomienie (np. `MatSnackBar`): _"Dostępna jest nowa wersja Budget Fort"_ z przyciskiem _"Zaktualizuj"_.
  4. Użytkownik klika _"Zaktualizuj"_.
  5. System wywołuje `swUpdate.activateUpdate()` i przeładowuje stronę (`document.location.reload()`).
- **Postcondition:** Aplikacja uruchamia się w najnowszej wersji, użytkownik pozostaje zalogowany ze swoimi danymi.

### UC-2: Odroczenie aktualizacji w trakcie pracy

- **Aktor:** Użytkownik
- **Precondition:** Użytkownik jest w trakcie wprowadzania transakcji lub planowania budżetu.
- **Main flow:**
  1. W tle wykryto nową wersję i pojawia się powiadomienie o aktualizacji.
  2. Użytkownik ignoruje powiadomienie lub zamyka je, kontynuując wprowadzanie danych.
  3. Dane transakcji zapisują się w lokalnej bazie IndexedDB.
  4. Aktualizacja zostanie zaaplikowana przy kolejnym naturalnym otwarciu/odświeżeniu aplikacji.
- **Postcondition:** Użytkownik nie traci żadnych wprowadzonych danych.

### UC-3: Prezentacja banera o planowanych pracach serwisowych

- **Aktor:** Użytkownik
- **Precondition:** Zespół planuje nocne wdrożenie / migrację bazy danych w godzinach 23:00–01:00.
- **Main flow:**
  1. Użytkownik otwiera aplikację.
  2. System sprawdza aktywne komunikaty systemowe (okres `startDate` do `endDate`).
  3. Na samej górze interfejsu (poniżej/powyżej nawigacji) renderuje się baner ostrzegawczy z treścią komunikatu.
  4. Użytkownik klika przycisk "Zamknij" (`X`).
  5. Identyfikator komunikatu zostaje zapisany w `localStorage`, baner znika do czasu pojawienia się nowego komunikatu.
- **Postcondition:** Użytkownik jest poinformowany o przerwie technicznej, nie jest blokowany.

---

## Edge Cases

- **Edge Case 1: Utrata połączenia internetowego (offline) podczas pobierania aktualizacji przez SW**
  - _Oczekiwane zachowanie:_ Błąd w tle nie wpływa na bieżące działanie aplikacji. Aplikacja kontynuuje pracę na dotychczasowej wersji cache'owanej.
- **Edge Case 2: Nieobsługiwany Service Worker (np. przeglądarka w trybie prywatnym / stary browser)**
  - _Oczekiwane zachowanie:_ `swUpdate.isEnabled` zwraca `false`. Serwis bezpiecznie ignoruje nasłuchiwanie zdarzeń, brak błędów w konsoli.
- **Edge Case 3: Brak dostępu do Firebase/Firestore podczas pobierania komunikatów serwisowych**
  - _Oczekiwane zachowanie:_ Pobieranie komunikatów kończy się cichym `catchError()`, interfejs renderuje się normalnie bez banera.

---

## Acceptance Criteria (AC)

### AC-1: Wykrycie nowej wersji i prezentacja powiadomienia

- **Given:** Aplikacja jest uruchomiona w przeglądarce wspierającej Service Worker i `swUpdate.isEnabled === true`.
- **When:** Service Worker wykryje i pobierze nową wersję (`versionUpdates` z typem `VERSION_READY`).
- **Then:** Wyświetla się powiadomienie `MatSnackBar` z informacją o nowej wersji i akcją "Zaktualizuj".

### AC-2: Bezpieczne przeładowanie po akcji użytkownika

- **Given:** Wyświetla się powiadomienie o nowej wersji.
- **When:** Użytkownik klika "Zaktualizuj".
- **Then:** Wywoływane jest `swUpdate.activateUpdate()`, a następnie przeładowanie aplikacji (`window.location.reload()`). Sesja użytkownika i lokalne dane w IndexedDB pozostają nienaruszone.

### AC-3: Wyświetlanie banera o pracach serwisowych

- **Given:** W systemie istnieje aktywne ogłoszenie o pracach serwisowych mieszczące się w przedziale czasowym `[startDate, endDate]`.
- **When:** Użytkownik wchodzi do aplikacji.
- **Then:** Baner informacyjny jest widoczny z odpowiednim poziomem istotności (`info` / `warning`).

### AC-4: Ukrywanie banera przez użytkownika

- **Given:** Baner z ogłoszeniem jest wyświetlany.
- **When:** Użytkownik klika ikonę zamknięcia banera.
- **Then:** Baner natychmiast znika, a klucz `dismissed_announcement_${id}` jest zapisywany w `localStorage`. Przy kolejnym przeładowaniu strony ten sam komunikat nie jest ponownie wyświetlany.

---

## Model danych

```typescript
export interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  dismissible: boolean;
}
```

---

## Architektura i Kontrakty Techniczne (Gate 2)

- **ADR Powiązany:** [ADR-006: PWA Update Management & Maintenance Announcements](../../adr/006-pwa-update-and-maintenance-banner.md)

### 1. Moduł PWA i Service Worker (`@angular/service-worker`)

- **Paczka:** `@angular/service-worker` w wersji zgodnej z `@angular/core` (`^22.0.6`).
- **Plik konfiguracyjny:** `apps/budget-fort/ngsw-config.json` definiujący assetGroups (`app` - prefetch, `assets` - lazy).
- **Rejestracja w `app.config.ts`:**
  ```typescript
  provideServiceWorker('ngsw-worker.js', {
    enabled: !isDevMode(),
    registrationStrategy: 'registerWhenStable:30000',
  });
  ```

### 2. Kontrakt serwisu aktualizacji (`PwaUpdateService`)

- **Lokalizacja:** `apps/budget-fort/src/app/services/pwa-update.service.ts`
- **Interfejs API:**
  ```typescript
  @Injectable({ providedIn: 'root' })
  export class PwaUpdateService {
    readonly isUpdateAvailable = signal<boolean>(false);
    init(): void;
    checkForUpdate(): Promise<boolean>;
    activateUpdate(): Promise<void>;
  }
  ```
- **Zachowanie:**
  - Wstrzykuje `SwUpdate` oraz `MatSnackBar`.
  - Po wykryciu zdarzenia `VERSION_READY` z `SwUpdate.versionUpdates` ustawia sygnał `isUpdateAvailable` na `true` i otwiera `MatSnackBar` z przyciskiem akcji "Zaktualizuj" (lub "Odśwież").
  - Po kliknięciu wywołuje `swUpdate.activateUpdate()` i bezpiecznie przeładowuje aplikację `document.location.reload()`.

### 3. Kontrakt serwisu i komponentu banera (`MaintenanceBannerComponent` & `AnnouncementService`)

- **Lokalizacja:**
  - Serwis: `apps/budget-fort/src/app/services/announcement.service.ts`
  - Komponent: `apps/budget-fort/src/app/components/maintenance-banner/maintenance-banner.component.ts`
- **Interfejs API serwisu:**
  ```typescript
  @Injectable({ providedIn: 'root' })
  export class AnnouncementService {
    readonly activeAnnouncement = signal<SystemAnnouncement | null>(null);
    dismissCurrent(): void;
  }
  ```
- **Zachowanie:**
  - Odpytuje Firestore `/system_announcements` lub korzysta z wbudowanego fallbacku.
  - Sprawdza okno czasowe `startDate <= now <= endDate` oraz czy id nie figuruje w `localStorage.getItem('dismissed_announcement_${id}')`.
  - W razie błędów sieciowych / trybu offline zachowuje stan cichy (`null`), nie zaburzając działania aplikacji.

### 4. UI / UX Design System (Anti-UI-Slop & A11y)

- **Komponent banera:**
  - Semantyczny kontener `<aside role="status" aria-live="polite" class="maintenance-banner maintenance-banner--[severity]">`.
  - Dostępne klasy BEM: `maintenance-banner__icon`, `maintenance-banner__content`, `maintenance-banner__title`, `maintenance-banner__message`, `maintenance-banner__close`.
  - Zgodność z motywami ciemnym i jasnym (`light-theme`, `dark-theme`) oraz tokenami kolorów Angular Material (`mat-sys-color-warning`, `mat-sys-color-surface-container`).
  - Minimalne tap targety dla przycisku zamknięcia: 48x48px (a11y).

---

## Implemented in

| File                                                                                          | Date       | AC Covered       |
| :-------------------------------------------------------------------------------------------- | :--------- | :--------------- |
| `apps/budget-fort/ngsw-config.json`                                                           | 2026-11-15 | AC-1             |
| `apps/budget-fort/src/app/models/announcement.model.ts`                                       | 2026-11-15 | AC-3, AC-4       |
| `apps/budget-fort/src/app/services/pwa-update.service.ts`                                     | 2026-11-15 | AC-1, AC-2       |
| `apps/budget-fort/src/app/services/pwa-update.service.spec.ts`                                | 2026-11-15 | AC-1, AC-2       |
| `apps/budget-fort/src/app/services/announcement.service.ts`                                   | 2026-11-15 | AC-3, AC-4       |
| `apps/budget-fort/src/app/services/announcement.service.spec.ts`                              | 2026-11-15 | AC-3, AC-4       |
| `apps/budget-fort/src/app/components/maintenance-banner/maintenance-banner.component.ts`      | 2026-11-15 | AC-3, AC-4       |
| `apps/budget-fort/src/app/components/maintenance-banner/maintenance-banner.component.scss`    | 2026-11-15 | AC-3, AC-4       |
| `apps/budget-fort/src/app/components/maintenance-banner/maintenance-banner.component.spec.ts` | 2026-11-15 | AC-3, AC-4       |
| `apps/budget-fort-e2e/src/pwa-update.spec.ts`                                                 | 2026-11-15 | AC-3, AC-4       |
| `apps/budget-fort/src/locale/messages.en.xlf`                                                 | 2026-11-15 | AC-1, AC-2, AC-3 |
