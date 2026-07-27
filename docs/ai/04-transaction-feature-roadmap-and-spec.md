# Transaction Feature Roadmap And Specification

Last updated: 2026-07-23

## Cel Produktowy

Zbudować mobilny, szybki i prosty w obsłudze moduł domowego budżetu w PWA, gdzie użytkownik:
- dodaje wydatek w 1-3 kliknięciach,
- widzi ostatnie transakcje i może je edytować,
- przechodzi do analityki wydatków (tydzień/miesiąc/rok, filtry kategorii).

## Zakres Aktualnej Inicjatywy

Aktualny fokus:
- Ekran Home Transactions jako ekran kontenerowy.
- Komunikacja komponentów przez facade stanu.
- Persystencja lokalna przez IndexedDB (warstwa data-access).
- Shell loading zamiast twardego blokowania nawigacji resolverem.

Poza aktualnym fokusem (kolejny etap):
- Dashboard analityczny z filtrami kategorii i agregacjami czasowymi.

## Wizja UX (Home Transactions)

Układ ekranu:
1. Czysty header
- ikona menu,
- aktualny miesiąc (np. LIPIEC),
- saldo (np. +2000 zł).

2. Szybkie dodawanie
- siatka kategorii (np. 4 kolumny),
- ikona nad podpisem kategorii,
- osobna pozycja Inne.

3. Ostatnie transakcje
- grupowanie po dniach (Dzisiaj, Wczoraj, data),
- pozycja transakcji: ikona kategorii, nazwa, kwota,
- interakcje: swipe lub klik do edycji/usuwania.

## Specyfikacja Funkcjonalna

### Ekrany i odpowiedzialności

1. Home Screen (container)
- orkiestruje ładowanie danych,
- pobiera stan z facade,
- przekazuje dane i eventy do komponentów UI,
- nie zawiera logiki persystencji.

2. Komponenty UI (presentational)
- Header: render miesiąca i salda,
- Categories Quick Add: render siatki i emisja eventu wyboru,
- Last Transactions: render sekcji dziennych i emisja eventów edycji/usunięcia.

3. Facade stanu
- jedno miejsce dla logiki biznesowej ekranu,
- kontrola loading/error/initialized,
- mapowanie danych do view modelu dla UI.

4. Data access
- jedyne miejsce kontaktu z IndexedDB,
- operacje CRUD bez logiki prezentacji.

### Przepływy użytkownika

1. Wejście na ekran
- start shell UI,
- ładowanie transakcji z lokalnej bazy,
- render sekcji transakcji po zakończeniu ładowania.

2. Quick add
- użytkownik wybiera kategorię,
- otwarcie formularza (bottom sheet) z prewybraną kategorią,
- zapis transakcji i odświeżenie stanu.

3. Edycja transakcji
- wejście z listy ostatnich transakcji,
- modyfikacja i zapis,
- aktualizacja listy i grup dziennych.

4. Usuwanie transakcji
- akcja dostępna z listy (swipe/menu),
- usunięcie rekordu,
- odświeżenie stanu i przeliczeń.

## Specyfikacja Techniczna

### Architektura stanu

Preferowany model na MVP:
- Signals: źródło prawdy dla stanu UI (transactions, loading, error, computed).
- async/await: dla prostych, jednorazowych akcji command (load/add/edit/delete).
- RxJS: pozostaje w data-access, szczególnie przy rozszerzeniach strumieniowych.

Uzasadnienie:
- czytelność i prostota implementacji,
- łatwe debugowanie,
- gotowość do późniejszego rozszerzenia o bardziej reaktywne scenariusze.

### RxResource

Rola edukacyjna i docelowa:
- używać świadomie tam, gdzie naprawdę pomaga w opisie cyklu zasobu,
- nie traktować jako jedynego mechanizmu trwałego stanu aplikacji,
- na tym etapie można dodać pilotowo do konkretnej sekcji UI do nauki API.

### Loading strategy

Decyzja na MVP:
- shell/skeleton na ekranie zamiast globalnego resolver-blocking.

Dlaczego:
- lepszy perceived performance,
- mniejsza szansa na „martwy” ekran przy wolniejszym odczycie lokalnym,
- bardziej mobilny charakter UX.

### Model danych transakcji

Obowiązkowe pola:
- id,
- amount,
- date,
- categoryId,
- accountId,
- comment opcjonalnie.

Zasady prezentacji:
- grupowanie po dniach,
- etykiety Dzisiaj i Wczoraj,
- fallback do pełnej daty lokalnej.

## Roadmapa

## Faza 1: Home MVP Foundation

Zakres:
- dokończenie facade stanu,
- podpięcie Home Screen do stanu,
- render quick add i last transactions,
- loading shell oraz obsługa błędów.

Kryterium akceptacji:
- użytkownik widzi dane po starcie,
- może dodać i edytować transakcję,
- UI odświeża się bez przeładowania ekranu.

## Faza 2: Transaction Interactions

Zakres:
- usuwanie transakcji,
- dopracowanie swipe/click actions,
- dopięcie bottom sheet flow.

Kryterium akceptacji:
- pełny CRUD transakcji działa lokalnie,
- spójne zachowanie listy i grup dziennych po każdej akcji.

## Faza 3: Quality And Reliability

Zakres:
- testy jednostkowe facade,
- testy komponentowe przepływów,
- scenariusze offline i regresji.

Kryterium akceptacji:
- stabilne testy krytycznych flow,
- brak regresji przy add/edit/delete.

## Faza 4: Dashboard Analytics Screen

Zakres:
- nowy ekran dashboard,
- agregacje tydzień/miesiąc/rok,
- filtry po kategoriach.

Kryterium akceptacji:
- użytkownik może analizować wydatki w czasie,
- filtrowanie i agregacje są poprawne i czytelne.

## Ryzyka I Słabe Punkty

1. Przeciążenie facade
- ryzyko łączenia wielu odpowiedzialności w jednej klasie.

Mitigacja:
- trzymać strict podział: data-access IO, facade logika, UI prezentacja.

2. Zbyt szybkie wejście w złożone RxJS
- ryzyko wzrostu złożoności bez realnej potrzeby.

Mitigacja:
- zaczynać od prostych commandów async/await,
- RxJS dokładać tam, gdzie potrzebna wieloemisyjność lub cancel/retry.

3. Niejednoznaczny UX akcji listy
- ryzyko niespójnej interakcji swipe vs click.

Mitigacja:
- zdefiniować jednoznaczny kontrakt interakcji na komponent listy.

## Otwarte Pytania Produktowe

1. Quick add zapisuje od razu czy zawsze otwiera formularz?
2. Jaki limit pozycji ma sekcja ostatnich transakcji?
3. Czy edycja/usuwanie ma być i na swipe, i na klik?
4. Jak dokładnie liczymy saldo w headerze na MVP?
5. Czy wymagane jest jawne potwierdzenie przy usuwaniu?

## Definition Of Done (dla Home Transactions)

Aby uznać funkcję za gotową:
- ekran renderuje header, quick add i listę ostatnich transakcji,
- dane ładują się z IndexedDB i odświeżają po akcji użytkownika,
- loading i błędy są obsłużone w UI,
- dostępne są add/edit/delete,
- testy krytycznych scenariuszy przechodzą.
