# Architecture Decision Records (ADR)

Indeks decyzji architektonicznych dla projektu Budget Fort.

ADR-y są tworzone przez Architekta w fazie [2] pipeline'u SDD
(zob. `docs/specs/01-spec-workflow.md`).

Szablon: [`adr-template.md`](./adr-template.md)

## Lista ADR

| ADR | Tytuł | Status | Data |
|-----|-------|--------|------|
| [ADR-001](./001-budget-separate-domain.md) | Osobna domena `budget` w `libs/budget/` | accepted | 2026-10-17 |
| [ADR-002](./002-auth-domain-and-firebase-integration.md) | Domena Auth, integracja z Firebase Authentication i hybrydowy tryb offline | accepted | 2026-11-11 |
| [ADR-003](./003-data-export-import-backup.md) | Eksport i import danych (Kopia zapasowa w formacie JSON) | accepted | 2026-11-11 |
| [ADR-004](./004-firestore-hybrid-sync-and-offline-first.md) | Hybrydowa synchronizacja IndexedDB (Dexie) z Cloud Firestore (Offline-First) | proposed | 2026-11-13 |

## Statusy

- **proposed** — zaproponowany, czeka na akceptację
- **accepted** — zaakceptowany, obowiązuje
- **deprecated** — nieaktualny, ale nie zastąpiony
- **superseded** — zastąpiony przez nowszy ADR

## Konwencja nazewnicza

```
docs/adr/<NNN>-<title>.md
```

Gdzie `<NNN>` to kolejny numer (001, 002, ...), a `<title>` to zwięzły tytuł oddzielony myślnikami.
