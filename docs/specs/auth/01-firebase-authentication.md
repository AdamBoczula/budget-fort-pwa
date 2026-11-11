# Spec: Autentykacja Firebase, Ekrany Logowania/Rejestracji, Guard i Resolver

## Metadata
- **Author:** Adam & Antigravity
- **Date:** 2026-11-11
- **Status:** implemented
- **Domain:** auth

---

## Cel biznesowy

Użytkownik może bezpiecznie logować się do aplikacji Budget Fort za pomocą konta Google (Gmail) lub adresu email i hasła (z weryfikacją adresu email przez Firebase), a także korzystać z aplikacji w pełni anonimowo w trybie lokalnym bez zakładania konta. Trasy aplikacji są zabezpieczone (`authGuard`), a dane transakcji i kategorii z lokalnej bazy IndexedDB są wstępnie pobierane przez resolver (`dashboardDataResolver`) przed wyświetleniem ekranu głównego.

---

## Zakres (Scope)

### W scope
1. **Integracja z Firebase Authentication**:
   - Logowanie email + hasło (`signInWithEmailAndPassword`).
   - Rejestracja email + hasło (`createUserWithEmailAndPassword`) z automatyczną wysyłką linku weryfikacyjnego (`sendEmailVerification`).
   - Logowanie przez konto Google za pomocą popupu (`GoogleAuthProvider`, `signInWithPopup`).
   - Obsługa stanu sesji (`onAuthStateChanged`) z persistencją (`browserLocalPersistence`).
2. **Ekrany i nawigacja (`libs/auth/feature-auth`)**:
   - Ekran logowania (`/login`): formularz email/hasło, przycisk "Zaloguj przez Google", przycisk "Używaj lokalnie (bez logowania)", link do rejestracji.
   - Ekran rejestracji (`/register`): formularz email + hasło + powtórzenie hasła z walidacją, link do logowania.
   - Ekran / stan weryfikacji adresu email (`/verify-email`): informacja o wysłaniu linku aktywacyjnego na email oraz przycisk ponownego wysłania linku.
3. **Tryb lokalny (Anonimowy)**:
   - Możliwość przejścia do aplikacji jednym kliknięciem bez konta Firebase (`guestMode = true` zapisywane w localStorage).
   - Pełna praca wyłącznie na lokalnej bazie IndexedDB (Dexie).
4. **Ochrona tras (`authGuard`)**:
   - Blokada dostępu do tras prywatnych (`/`, `/settings`, `/budget`, `/history`) dla niezalogowanych użytkowników.
   - Przepuszczenie użytkownika, jeśli:
     - Jest zalogowany przez Google, LUB
     - Jest zalogowany przez email i ma zweryfikowany email (`emailVerified === true`), LUB
     - Wybrał tryb lokalny (`guestMode === true`).
   - Przekierowanie niezalogowanych na `/login`.
   - Przekierowanie już zalogowanych z `/login` i `/register` na `/`.
5. **Data Resolver (`dashboardDataResolver`)**:
   - Uruchamiany przy przejściu na ekran główny (`/`).
   - Asynchronicznie odpytuje IndexedDB o kategorie i transakcje bieżącego okresu przed aktywacją widoku.
6. **Wylogowanie**:
   - Przycisk w menu/ustawieniach (`signOut`), czyszczenie stanu sesji/flagi gościa i powrót na `/login`.
7. **Jakość, Dostępność i i18n**:
   - Zgodność z Anti-UI-Slop (Angular Material, BEM w oddzielnych plikach `.scss`, inline template).
   - Wsparcie dla i18n (PL/EN) przez znaczniki `i18n="@@..."`.

### Out of scope
- Chmurowa synchronizacja bazy danych (Firestore sync) – dane transakcji pozostają w lokalnym IndexedDB (krok przygotowawczy pod przyszłą synchronizację).
- Passwordless / Magic Link login (wybrano tradycyjne hasło + link weryfikacyjny).
- Dwuskładnikowe uwierzytelnianie (MFA / 2FA).
- Integracja z Apple ID / Facebook / GitHub (tylko Google i Email).

---

## Use Cases (UC)

### UC-1: Logowanie adresem email i hasłem
- **Aktor:** Użytkownik posiadający konto z potwierdzonym adresem email.
- **Precondition:** Użytkownik znajduje się na trasie `/login`.
- **Main flow:**
  1. Użytkownik wpisuje email oraz hasło i klika "Zaloguj się".
  2. System wywołuje Firebase `signInWithEmailAndPassword`.
  3. System sprawdza, czy `user.emailVerified === true`.
  4. Jeśli tak: system ustawia stan sesji i przekierowuje użytkownika na trasę `/`.
  5. `dashboardDataResolver` wczytuje dane z IndexedDB i ekran główny renderuje się z załadowanymi danymi.
- **Postcondition:** Użytkownik ma aktywną sesję autentykacji, ekran główny jest widoczny.

### UC-2: Rejestracja adresem email i hasłem z weryfikacją email
- **Aktor:** Nowy użytkownik.
- **Precondition:** Użytkownik znajduje się na trasie `/register`.
- **Main flow:**
  1. Użytkownik wprowadza poprawny adres email, hasło (min. 8 znaków) oraz powtórzenie hasła.
  2. Użytkownik klika "Zarejestruj się".
  3. System tworzy konto w Firebase (`createUserWithEmailAndPassword`).
  4. System natychmiast wysyła wiadomość weryfikacyjną (`sendEmailVerification`).
  5. System wylogowuje tymczasową sesję (aby zablokować dostęp przed weryfikacją) i przekierowuje na ekran `/verify-email`.
  6. Ekran wyświetla komunikat z adresem email, na który wysłano link, oraz przycisk "Przejdź do logowania" i "Wyślij link ponownie".
- **Postcondition:** Konto jest utworzone, oczekuje na kliknięcie w link aktywacyjny w skrzynce pocztowej użytkownika.

### UC-3: Logowanie przez konto Google
- **Aktor:** Użytkownik posiadający konto Google.
- **Precondition:** Użytkownik znajduje się na `/login` lub `/register`.
- **Main flow:**
  1. Użytkownik klika "Zaloguj przez Google".
  2. System otwiera okno popup Firebase `signInWithPopup(auth, googleProvider)`.
  3. Użytkownik wybiera swoje konto Google i wyraża zgodę.
  4. Firebase zwraca poświadczenia (konto Google ma automatycznie zweryfikowany email).
  5. System aktualizuje stan sesji w sygnale i przekierowuje na `/`.
- **Postcondition:** Użytkownik jest zalogowany tożsamością Google, ekran główny wyświetla dane.

### UC-4: Użycie aplikacji bez logowania (Tryb lokalny / Gość)
- **Aktor:** Użytkownik preferujący prywatność lub brak konta w chmurze.
- **Precondition:** Użytkownik znajduje się na ekranie `/login`.
- **Main flow:**
  1. Użytkownik klika przycisk "Używaj lokalnie (bez logowania)".
  2. System zapisuje w `localStorage` flagę `bf_guest_mode = 'true'`.
  3. System aktualizuje stan `AuthState` na `mode: 'guest'`.
  4. System przekierowuje na `/`.
- **Postcondition:** Użytkownik ma pełny dostęp do funkcjonalności aplikacji działającej na lokalnym IndexedDB bez monitów o logowanie.

### UC-5: Ochrona tras (Route Guard)
- **Aktor:** Niezalogowany użytkownik lub użytkownik z niezweryfikowanym emailem.
- **Precondition:** Użytkownik próbuje bezpośrednio otworzyć trasę chronioną (np. `/`, `/settings`, `/budget`).
- **Main flow:**
  1. `authGuard` sprawdza aktualny stan autentykacji (poczekawszy na inicjalizację `onAuthStateChanged`).
  2. Jeżeli brak sesji Firebase i brak flagi gościa:
     - Guard zapamiętuje URL docelowy (`returnUrl`).
     - Przekierowuje na `/login`.
  3. Jeżeli użytkownik jest zalogowany mailem, ale `emailVerified === false`:
     - Przekierowuje na `/verify-email`.
  4. Jeżeli użytkownik jest poprawnie zalogowany lub w trybie gościa:
     - Zwraca `true` i zezwala na nawigację.
- **Postcondition:** Trasy chronione są niedostępne dla osób nieuprawnionych.

### UC-6: Pobranie danych przez Data Resolver
- **Aktor:** Użytkownik wchodzący na ekran główny.
- **Precondition:** Użytkownik przeszedł weryfikację `authGuard`.
- **Main flow:**
  1. Router wywołuje `dashboardDataResolver`.
  2. Resolver równolegle lub sekwencyjnie pobiera z `libs/transaction/data-access-transaction` oraz `libs/budget/data-access-budget` stan kategorii i transakcji z bazy IndexedDB.
  3. Po pomyślnym rozwiązaniu obietnicy router aktywuje komponent dashboardu.
  4. Komponent renderuje widok bez migotania (brak skeletonów z pustymi danymi).
- **Postcondition:** Ekran główny pojawia się natychmiast z kompletem danych.

### UC-7: Wylogowanie
- **Aktor:** Zalogowany użytkownik lub gość.
- **Precondition:** Użytkownik jest w aplikacji.
- **Main flow:**
  1. Użytkownik wybiera opcję "Wyloguj" w menu nawigacyjnym / ustawieniach.
  2. System wywołuje `signOut(auth)` (jeśli zalogowany w Firebase) oraz usuwa flagę `bf_guest_mode`.
  3. Stan autentykacji jest resetowany do `unauthenticated`.
  4. Router nawiguje na `/login`.
- **Postcondition:** Sesja jest zakończona, próba powrotu cofa na `/login`.

---

## Edge Cases

- **EC-1: Błędne poświadczenia logowania (`auth/invalid-credential`, `auth/wrong-password`)**:
  - *Zachowanie:* Formularz logowania nie przeładowuje się, wyświetla czytelny komunikat błędu Material (`Nieprawidłowy adres email lub hasło`) pod formularzem.
- **EC-2: Próba rejestracji na zajęty email (`auth/email-already-in-use`)**:
  - *Zachowanie:* Komunikat błędu: `Konto z tym adresem email już istnieje. Zaloguj się lub zresetuj hasło.` z linkiem do logowania.
- **EC-3: Użytkownik nie kliknął linku weryfikacyjnego i próbuje się zalogować**:
  - *Zachowanie:* Firebase pozwala na `signIn`, lecz aplikacja sprawdza `user.emailVerified`. W przypadku `false` aplikacja natychmiast wylogowuje użytkownika, wyświetla komunikat informacyjny i przekierowuje na `/verify-email` z możliwością ponownego wysłania maila aktywacyjnego.
- **EC-4: Anulowanie okna Google Sign-In (`auth/popup-closed-by-user`)**:
  - *Zachowanie:* Brak crashu aplikacji, spinner ładowania znika, użytkownik pozostaje na ekranie logowania w stanie gotowości do ponownej akcji.
- **EC-5: Brak połączenia z internetem podczas próby logowania online**:
  - *Zachowanie:* Komunikat: `Brak połączenia z siecią. Sprawdź internet lub skorzystaj z trybu lokalnego (bez logowania)`.
- **EC-6: Uruchomienie aplikacji offline przez wcześniej zalogowanego użytkownika**:
  - *Zachowanie:* Firebase SDK korzysta z IndexedDB cache sesji (`browserLocalPersistence`). Sesja zostaje odtworzona bez konieczności połączenia z serwerami Firebase, `authGuard` zezwala na wejście, a resolver ładuje lokalne dane z Dexie.
- **EC-7: Błąd IndexedDB podczas działania Data Resolvera**:
  - *Zachowanie:* Resolver loguje błąd i zwraca stan awaryjny (puste kolekcje), nie blokując całkowicie przejścia do ekranu głównego.

---

## Acceptance Criteria (AC)

### AC-1: Logowanie poprawnymi poświadczeniami email/hasło
- **Given:** Użytkownik zarejestrowany z potwierdzonym adresem email.
- **When:** Użytkownik wprowadza poprawny email i hasło na `/login` i klika "Zaloguj się".
- **Then:** System autoryzuje użytkownika, ustawia sygnał `currentUser` i przekierowuje na `/`.

### AC-2: Blokada logowania dla niezweryfikowanego adresu email
- **Given:** Użytkownik posiada konto, ale nie potwierdził adresu email (`emailVerified === false`).
- **When:** Użytkownik wprowadza dane i klika "Zaloguj się".
- **Then:** System nie wpuszcza do aplikacji, wyświetla ostrzeżenie o wymogu weryfikacji i kieruje na `/verify-email`.

### AC-3: Rejestracja nowego konta i wysłanie maila aktywacyjnego
- **Given:** Nowy użytkownik na ekranie `/register`.
- **When:** Użytkownik wpisuje poprawny nieużywany email oraz hasło spełniające wymogi (min. 8 znaków) i zatwierdza formularz.
- **Then:** Konto jest tworzone w Firebase, wywoływane jest `sendEmailVerification`, a użytkownik widzi ekran z potwierdzeniem wysłania wiadomości aktywacyjnej.

### AC-4: Logowanie przez Google
- **Given:** Użytkownik na `/login`.
- **When:** Użytkownik klika "Zaloguj przez Google" i pomyślnie uwierzytelnia się w oknie Google.
- **Then:** System odczytuje tożsamość Google i przekierowuje użytkownika na ekran `/`.

### AC-5: Wybór trybu lokalnego (Gość)
- **Given:** Niezalogowany użytkownik na `/login`.
- **When:** Użytkownik klika "Używaj lokalnie (bez logowania)".
- **Then:** Flaga `bf_guest_mode` jest ustawiana na `true`, stan sesji staje się aktywny w trybie gościa, a użytkownik jest przekierowywany na `/`.

### AC-6: Blokada nieautoryzowanego dostępu przez authGuard
- **Given:** Użytkownik niezalogowany i bez aktywnego trybu gościa.
- **When:** Użytkownik próbuje otworzyć w przeglądarce trasę chronioną (np. `/` lub `/settings/budget`).
- **Then:** Nawigacja jest wstrzymywana, następuje przekierowanie na `/login` z parametrem `returnUrl`.

### AC-7: Płynne ładowanie danych przez dashboardDataResolver
- **Given:** Użytkownik przechodzi pomyślnie `authGuard` na trasę `/`.
- **When:** Trasa `/` jest aktywowana.
- **Then:** `dashboardDataResolver` wczytuje z IndexedDB kategorie i transakcje przed wyrenderowaniem widoku głównego.

### AC-8: Wylogowanie
- **Given:** Użytkownik zalogowany lub w trybie gościa na dowolnym ekranie aplikacji.
- **When:** Użytkownik klika przycisk "Wyloguj".
- **Then:** Sesja Firebase i flaga gościa są usuwane, a użytkownik trafia na `/login`. Ponowna próba wejścia na `/` jest blokowana przez guard.

---

## Architektura i Kontrakty Techniczne

### 1. Podział bibliotek w Monorepo Nx

```
libs/auth/
├── data-access-auth/        # Serwisy Firebase Auth, stan sesji (Signals), adaptery
│   ├── src/lib/services/auth.service.ts
│   ├── src/lib/state/auth.state.ts
│   └── src/index.ts
├── feature-auth/            # Komponenty routingu, guardy, resolvery
│   ├── src/lib/login/login.component.ts|scss|spec.ts
│   ├── src/lib/register/register.component.ts|scss|spec.ts
│   ├── src/lib/verify-email/verify-email.component.ts|scss|spec.ts
│   ├── src/lib/guards/auth.guard.ts
│   ├── src/lib/resolvers/dashboard-data.resolver.ts
│   ├── src/lib/feature-auth.routes.ts
│   └── src/index.ts
└── ui-auth/                 # Prezentacyjne elementy Material (np. przycisk Google, panel auth)
    ├── src/lib/google-sign-in-button/...
    └── src/index.ts
```

### 2. Model Stanu Autentykacji (`AuthState`)

```typescript
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  emailVerified: boolean;
  providerId: 'google.com' | 'password' | 'guest';
}

export type AuthMode = 'authenticated' | 'guest' | 'unauthenticated' | 'loading';

export interface AuthStateModel {
  mode: AuthMode;
  user: AuthUser | null;
  error: string | null;
}
```

### 3. Kontrakt Serwisu (`AuthService`)

```typescript
export interface IAuthService {
  readonly state: Signal<AuthStateModel>;
  readonly isAuthenticated: Signal<boolean>;
  readonly isGuest: Signal<boolean>;
  readonly currentUser: Signal<AuthUser | null>;

  loginWithEmail(credentials: LoginCredentials): Promise<void>;
  registerWithEmail(credentials: RegisterCredentials): Promise<void>;
  loginWithGoogle(): Promise<void>;
  continueAsGuest(): void;
  sendVerificationEmail(): Promise<void>;
  logout(): Promise<void>;
}
```

### 4. Routing & Guardy (`app.routes.ts`)

```typescript
export const appRoutes: Route[] = [
  {
    path: 'auth',
    loadChildren: () => import('@feature-auth').then((m) => m.featureAuthRoutes),
  },
  {
    path: '',
    canActivate: [authGuard],
    resolve: {
      initialData: dashboardDataResolver,
    },
    loadChildren: () => import('@feature-transaction').then((m) => m.featureTransactionRoutes),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
```

---

## UI / UX (Zgodność z Anti-UI-Slop & Material)

### Formularze i Ekrany
- **Ekran Logowania (`/auth/login`)**:
  - `mat-card` o stałej maksymalnej szerokości (`max-width: 420px`), wycentrowana na ekranie.
  - Wyraziste logo Budget Fort oraz nagłówek.
  - Pola formularza `mat-form-field` z `appearance="outline"` dla Email i Hasła.
  - Przycisk akcji głównej: `button[mat-flat-button][color="primary"]` ("Zaloguj się").
  - Separator z tekstem "lub".
  - Przycisk logowania Google z oficjalną ikoną SVG Google.
  - Przycisk pomocniczy: `button[mat-stroked-button]` ("Używaj lokalnie (bez logowania)").
  - Stopka z linkiem "Nie masz konta? Zarejestruj się".
- **Ekran Rejestracji (`/auth/register`)**:
  - Spójna karta Material, pola: Email, Hasło, Powtórz hasło.
  - Przycisk "Zarejestruj się", link powrotu do logowania.
- **Stany ekranów**:
  - *Loading:* `mat-progress-bar` u góry karty lub `mat-spinner` wewnątrz przycisku z blokadą ponownych kliknięć (`disabled`).
  - *Error:* komunikaty walidacji pod polami (`mat-error`) oraz baner błędu z góry formularza.

---

## Implemented in

| File | Date | AC Covered |
|------|------|------------|
| `libs/auth/data-access-auth/src/lib/services/auth.service.ts` | 2026-11-11 | AC-1, AC-2, AC-3, AC-4, AC-5, AC-8 |
| `libs/auth/data-access-auth/src/lib/services/auth.service.spec.ts` | 2026-11-11 | AC-1, AC-2, AC-3, AC-4, AC-5, AC-8 |
| `libs/auth/ui-auth/src/lib/google-sign-in-button/google-sign-in-button.component.ts` | 2026-11-11 | AC-4 |
| `libs/auth/ui-auth/src/lib/google-sign-in-button/google-sign-in-button.component.spec.ts` | 2026-11-11 | AC-4 |
| `libs/auth/feature-auth/src/lib/guards/auth.guard.ts` | 2026-11-11 | AC-2, AC-6 |
| `libs/auth/feature-auth/src/lib/guards/auth.guard.spec.ts` | 2026-11-11 | AC-2, AC-6 |
| `libs/auth/feature-auth/src/lib/resolvers/dashboard-data.resolver.ts` | 2026-11-11 | AC-7 |
| `libs/auth/feature-auth/src/lib/resolvers/dashboard-data.resolver.spec.ts` | 2026-11-11 | AC-7 |
| `libs/auth/feature-auth/src/lib/login/login.component.ts` | 2026-11-11 | AC-1, AC-4, AC-5 |
| `libs/auth/feature-auth/src/lib/login/login.component.spec.ts` | 2026-11-11 | AC-1, AC-4, AC-5 |
| `libs/auth/feature-auth/src/lib/register/register.component.ts` | 2026-11-11 | AC-3 |
| `libs/auth/feature-auth/src/lib/register/register.component.spec.ts` | 2026-11-11 | AC-3 |
| `libs/auth/feature-auth/src/lib/verify-email/verify-email.component.ts` | 2026-11-11 | AC-3 |
| `libs/auth/feature-auth/src/lib/verify-email/verify-email.component.spec.ts` | 2026-11-11 | AC-3 |
| `apps/budget-fort/src/app/app.routes.ts` | 2026-11-11 | AC-6, AC-7 |
| `libs/transaction/src/lib/ui-transaction/src/lib/ui-transaction/transaction-navigation-drawer.component.ts` | 2026-11-11 | AC-8 |
| `apps/budget-fort-e2e/src/auth.spec.ts` | 2026-11-11 | AC-3, AC-5, AC-6, AC-8 |
