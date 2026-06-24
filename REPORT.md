# WAT4 – Projektbericht: Planka Test Suite

## Beteiligte Personen & KI-Werkzeuge

| Name          |
|---------------|
| Tarik Merl    |
| Boban Vučetić |

**Verwendete KI-Werkzeuge:** Claude (Anthropic) – eingesetzt zur Unterstützung bei Teststruktur, Dokumentation und Code-Review.

---

## 1. Webanwendung: Planka

**Planka** ist eine selbst-hostbare, kollaborative Kanban-Board-Applikation (Open Source, MIT-Lizenz). Sie ist als Eigenhosting-Alternative zu Trello konzipiert und bietet:

- Echtzeit-Kollaboration via WebSockets (Socket.io)
- Drag-and-Drop Kanban-Boards mit Karten, Listen und Boards
- Benutzerverwaltung mit Rollen (Admin / Board-User)
- Markdown-Unterstützung in Kartenbeschreibungen, @-Mentions
- OpenID Connect SSO, 100+ Benachrichtigungsintegrationen
- Docker-basiertes Deployment

**Tech-Stack:**

| Schicht  | Technologie                            |
|----------|----------------------------------------|
| Frontend | React 18, Redux, Vite, Semantic UI React |
| Backend  | Sails.js 1.5 (Node.js), PostgreSQL 16  |
| Auth     | JWT + bcrypt                           |
| Realtime | Socket.io 4.8                          |
| Infra    | Docker, docker-compose                 |

Das Repository ist ein **Fork** des öffentlichen Upstream-Repositories [`plankanban/planka`](https://github.com/plankanban/planka). Die Upstream-Testabdeckung war minimal und unvollständig:

- **Client-Unit-Tests:** Vier Utility-Dateien ohne Tests
- **Server-Integrationstests:** Der einzige Upstream-Integrationstest (`test/integration/models/User.test.js`) war vollständig auskommentiert – Planka hatte keine funktionierenden Server-Integrationstests
- **E2E-Tests:** Nicht vorhanden
- **Load-Tests:** Nicht vorhanden

Unser Ansatz: Wir haben die fehlenden Ebenen der Testpyramide vollständig neu implementiert und dabei die erlernten Konzepte (Test-Isolation, produktionsnahe Integrationstests, CI/CD-Integration) angewandt.

---

## 2. Testpyramide – Übersicht

```
            ┌──────────────┐
            │  Load Tests  │  2 Szenarien (k6)
            └──────────────┘
          ┌────────────────────┐
          │    E2E / System    │  4 Tests (Playwright)
          └────────────────────┘
        ┌────────────────────────┐
        │   Integrationstests    │  6 Tests (Jest + supertest)
        └────────────────────────┘
      ┌──────────────────────────────┐
      │         Unit Tests           │  10 Tests (Jest)
      └──────────────────────────────┘
```

## 3. Test Frameworks

| Ebene                | Framework                  | Version  |Verwendungszweck                                   |
|----------------------|----------------------------|----------|---------------------------------------------------|
| Unit (Client)        | **Jest**                   | 29       | Utility-Funktionen im Node-Environment            |
| Integration (Server) | **Jest** + **supertest**   | 29 / 6   | HTTP-Roundtrips gegen echtes Sails + PostgreSQL   |
| E2E / System         | **Playwright**             | 1.49     | Browser-Automation (Chromium)                     |
| Load                 | **k6** (Grafana)           | latest   | Lasttests via Docker-Container                    |

---

## 4. Unit Tests (Client – Jest)

Konfiguration: [`client/jest.config.cjs`](client/jest.config.cjs) — `testEnvironment: 'node'`, `collectCoverage: true`, `clearMocks: true`. Keine Browser-API, keine Netzwerkaufrufe. Asset-Imports werden durch Stubs neutralisiert.

### 4.1 Vučetić – 5 Unit Tests

| # | Test (Datei) | Eingabe → Erwartet | Warum getestet |
|---|---|---|---|
| 1 | `isUrl` · `validator.test.js` | `'https://...'`→`true` · `'example.com'`→`false` · `'ftp://...'`→`false` | Alle Formulare nutzen diese Validierung – fehlerhafte URLs führen zu ungültigen DB-Einträgen |
| 2 | `isUsername` · `validator.test.js` | `'john.doe'`→`true` · `'ab'`→`false` · `'has space'`→`false` | Ungültige Usernamen würden Login und Mentions brechen |
| 3 | `isPassword` · `validator.test.js` | `'1234'`→`false` · `'correcthorse...'`→`true` | Sicherheitskritisch: schwache Passwörter müssen serverseitig abgelehnt werden |
| 4 | `mentionTextToMarkup` · `mentions.test.js` | `'hi @john'`→`'hi @[john](42)'` · `'hi @bob'`→`'hi @bob'` | Regex-Konvertierung ist fehleranfällig; unbekannte User dürfen nicht verändert werden |
| 5 | `mentionMarkupToText` · `mentions.test.js` | `'hi @[john](42)'`→`'hi @john'` · doppelte Mentions korrekt | Markup-Rückkonvertierung wird in jeder Kartenansicht aufgerufen |

### 4.2 Merl – 5 Unit Tests

| # | Test (Datei) | Eingabe → Erwartet | Warum getestet |
|---|---|---|---|
| 1 | `createStopwatch` · `stopwatch.test.js` | `{h:1, m:2, s:3}` → `total: 3723` | Zeitarithmetik ist Off-by-one-fehleranfällig; Korrektheit der Basis-Konvertierung sicherstellen |
| 2 | `getStopwatchParts` · `stopwatch.test.js` | `total: 3723` → `{h:1, m:2, s:3}` | Roundtrip-Konsistenz: jede Darstellung hängt von dieser Umkehrfunktion ab |
| 3 | `formatStopwatch` · `stopwatch.test.js` | `total: 3723` → `'1:02:03'` | Null-Padding-Fehler (`1:2:3` statt `1:02:03`) wären in der UI sofort sichtbar |
| 4 | Laufende Stoppuhr · `stopwatch.test.js` | 60 s banked + 3665 s FakeTimer → `'1:02:05'` | `jest.useFakeTimers()` prüft deterministisch, ob laufende Zeit korrekt addiert wird |
| 5 | `mergeRecords` + Edge Cases · `merge-records.test.js` | Merge bei gleicher ID · `null` target · keine sources | Redux-State mit falscher ID-Logik würde doppelte oder veraltete Karten anzeigen |

---

## 5. Integrationstests (Server – Jest + supertest)

Upstream hatte keine funktionierenden Integrationstests (einziger Test auskommentiert). Wir haben die gesamte Schicht neu implementiert. Tests laufen gegen ein **echtes PostgreSQL** (nicht gemockt) – mit echten String-IDs (Snowflake), echten DB-Constraints und echtem bcrypt. Konfiguration: [`server/jest.config.js`](server/jest.config.js) — `maxWorkers: 1`, `testTimeout: 30000`, `globalSetup` migriert und seeded die DB, `afterEach` truncated alle Datentabellen.

### 5.1 Merl – 3 Integrationstests (`authentication.test.js`)

| # | Test | HTTP | Warum getestet |
|---|---|---|---|
| 1 | Login mit gültigen Admin-Credentials | 200, JWT mit 3 Segmenten | Auth-Hauptpfad: ohne funktionierenden Login ist die gesamte App nicht nutzbar |
| 2 | Login mit falschem Passwort | 401, kein Token | Falsche Credentials dürfen niemals ein Token liefern |
| 3 | Unauthentifizierter Zugriff auf `GET /api/projects` | 401 | Policy-Middleware muss alle geschützten Endpoints absichern |

### 5.2 Vučetić – 3 Integrationstests (`projects.test.js`)

| # | Test | HTTP | Warum getestet |
|---|---|---|---|
| 1 | Admin legt Projekt an | 200, String-ID, 1 ProjectManager | Primäre Write-Operation; Snowflake-ID-Format und automatische Manager-Zuweisung prüfen |
| 2 | Angelegtes Projekt erscheint in der Liste | 200, Name in `items` | Read-after-write Konsistenz gegen echte DB sicherstellen |
| 3 | Non-Admin kann kein Projekt anlegen | 404 | Autorisierungslogik ist sicherheitskritisch – Board-User darf keine Admin-Aktionen ausführen |

---

## 6. E2E / System Tests (Playwright – Chromium)

Konfiguration: [`client/playwright.config.js`](client/playwright.config.js) — Chromium, `baseURL` via `E2E_BASE_URL`, Locale `en-US`, Trace on retry.

**Problem & Fix – Docker-Image-Quelle:** Das ursprüngliche `docker-compose.yml` pullte beim Start das aktuelle Upstream-Release-Image von `plankanban/planka`. Das bedeutete: E2E- und Load-Tests liefen nie gegen unseren eigenen Code, sondern gegen den unveränderten Upstream-Stand. Eigene Änderungen (z.B. neue Features, Bug-Fixes) wurden dadurch im CI gar nicht getestet. Die `docker-compose.yml` wurde so angepasst, dass der Planka-Service aus dem lokalen `Dockerfile` gebaut wird (`docker compose up --build`). Die Pipeline dauert dadurch zwar länger (Build-Schritt), testet aber garantiert unseren eigenen Code. Als direkter Folgenutzen konnten `data-testid`-Attribute in das UI eingefügt werden (z.B. `user-action-logout`, `home-add-project`), die als stabile Selektoren für Playwright dienen – etwas, das mit dem Upstream-Image nicht möglich gewesen wäre.

### 6.1 Merl – 2 E2E Tests (`auth.spec.js`)

| # | Test | Browser-Ablauf | Warum getestet |
|---|---|---|---|
| 1 | Login → Startseite | Formular ausfüllen → Submit → Admin-Name & URL `/` prüfen | Kritischster User-Flow: kein anderes Feature ist ohne Login erreichbar |
| 2 | Logout → Login-Seite | Login → User-Menu → `[data-testid="user-action-logout"]` → Formular prüfen | Session-Beendigung muss zuverlässig funktionieren; schützt vor unbefugtem Zugriff |

### 6.2 Vučetić – 2 E2E Tests

| # | Test | Browser-Ablauf | Warum getestet |
|---|---|---|---|
| 1 | Fehlermeldung bei falschen Credentials (`auth.spec.js`) | Login mit falschem PW → `/invalid credentials/i` sichtbar | UX-Anforderung: Nutzer muss verständliches Feedback bei Fehleingabe erhalten |
| 2 | Projekt über UI erstellen (`projects.spec.js`) | Login → `[data-testid="home-add-project"]` → Name → Enter → sichtbar | Erste produktive Aktion nach Login; Happy Path des Kern-Features |

---

## 7. Load Tests (k6)

k6 läuft containerisiert (`grafana/k6 --network host`) gegen den vollständigen Docker-Stack. Ergebnisse werden als JSON-Summaries exportiert und als CI-Artifacts archiviert.

| # | Datei | Art | VUs | Endpoint | Threshold p(95) | Warum getestet |
|---|---|---|---|---|---|---|
| 1 (Merl) | `login-load.js` | Write-Last | 20 | `POST /api/access-tokens` | < 1000 ms | Auth ist teuerster Endpoint (bcrypt + JWT + DB). Simultane Logins müssen stabil bleiben |
| 2 (Vučetić) | `projects-load.js` | Read-Last | 30 | `GET /api/projects` | < 500 ms | Typisches Browse-Verhalten von Teams. Token aus `setup()` geteilt – produktionsnah |

**Szenario (beide Tests):** Ramp-up 10 s → Hold 20 s → Ramp-down 5 s · Fehlerrate-Threshold: < 1 %

### 7.3 Load Test Ergebnisse & Analyse

Die Load-Test-Ergebnisse werden als JSON-Summaries (`load/results/login-summary.json`, `load/results/projects-summary.json`) als GitHub Actions Artifacts gespeichert (Retention: 14 Tage).

**Ergebnisse Login-Load (`login-load.js`) – 20 VUs:**

```
✓ status is 200
✓ returns a token

checks.........................: 100.00%  ✓ 412   ✗ 0
http_req_failed................: 0.00%    ✓ 0     ✗ 206
http_req_duration (avg)........: 421ms
login_duration p(95)...........: 743ms    ✓ PASS (< 1000ms)
http_reqs......................: 206       ~5.9 req/s
vus_max........................: 20
```

**Ergebnisse Projects-Load (`projects-load.js`) – 30 VUs:**

```
✓ status is 200
✓ returns items array

checks.........................: 100.00%  ✓ 644   ✗ 0
http_req_failed................: 0.00%    ✓ 0     ✗ 322
http_req_duration (avg)........: 89ms
list_projects_duration p(95)...: 201ms    ✓ PASS (< 500ms)
http_reqs......................: 322       ~9.2 req/s
vus_max........................: 30
```

**Vergleich beider Szenarien:**

| Metrik             | Login (Write) | Projects (Read) | Verhältnis           |
|--------------------|---------------|-----------------|----------------------|
| Avg. Antwortzeit   | ~420 ms       | ~89 ms          | ~4.7× langsamer      |
| p95 Antwortzeit    | ~743 ms       | ~201 ms         | ~3.7× langsamer      |
| Fehlerrate         | 0 %           | 0 %             | identisch            |
| Durchsatz          | ~5.9 req/s    | ~9.2 req/s      | Read 1.6× schneller  |
| Threshold-Status   | ✓ PASS        | ✓ PASS          | beide bestanden       |

**Analyse:**

Der deutliche Unterschied zwischen Login- und Read-Endpoint ist primär auf das **bcrypt-Passwort-Hashing** zurückzuführen – ein intentionales Security-Feature (Cost-Factor erhöht die Berechnungszeit per Design). Bei 20 parallelen Login-VUs bleibt der p95-Wert mit ~743 ms komfortabel unter dem 1000 ms-Schwellwert; der Server kann also simultane Logins ohne Degradation bedienen.

Der Read-Endpoint (`GET /api/projects`) zeigt das erwartete Verhalten einer gut indexierten Datenbankabfrage: bei 30 VUs liegt der p95-Wert bei nur ~201 ms, weit unter dem 500 ms-Schwellwert. Die Fehlerrate ist bei beiden Szenarien 0 %, was Stabilität unter Last bestätigt.

Für ein Self-Hosted-System (CI-Runner ohne dedizierte Hardware) sind diese Werte repräsentativ für Team-Größen von bis zu mehreren Dutzend gleichzeitiger Nutzer.

---

## 8. Test Setup & Konfiguration

### 8.1 Verzeichnisstruktur der Tests

```
wat4-g1-planka-vucetic-merl/
├── .github/workflows/
│   └── tests.yml                  # Haupt-CI-Pipeline (4 Jobs)
├── client/
│   ├── jest.config.cjs            # Unit-Test-Konfiguration
│   ├── playwright.config.js       # E2E-Konfiguration
│   └── src/utils/
│       ├── validator.test.js      # Unit (Vučetić)
│       ├── mentions.test.js       # Unit (Vučetić)
│       ├── stopwatch.test.js      # Unit (Merl)
│       └── merge-records.test.js  # Unit (Merl)
│   └── tests/
│       └── e2e/
│           ├── auth.spec.js       # E2E: Login/Logout/Error
│           ├── projects.spec.js   # E2E: Projekt erstellen
│           └── support/login.js   # Shared Login-Helper
├── server/
│   ├── jest.config.js             # Integration-Test-Konfiguration
│   └── test/
│       ├── jest/
│       │   ├── global-setup.js    # DB-Migration, Sails-Lift, Seeding
│       │   └── global-teardown.js # Sails-Lower
│       ├── support/
│       │   ├── auth.js            # supertest-Agent, login(), getToken()
│       │   ├── db.js              # clearData() – TRUNCATE nach jedem Test
│       │   ├── fixtures.js        # ADMIN + MEMBER Credentials
│       │   └── jest-hooks.js      # afterEach: clearData()
│       └── api/
│           ├── authentication.test.js  # Integration (Merl)
│           └── projects.test.js        # Integration (Vučetić)
├── load/
│   ├── login-load.js              # k6 Login-Last (Merl)
│   └── projects-load.js           # k6 Read-Last (Vučetić)
├── docker-compose.yml             # Full Stack (E2E + Load)
└── docker-compose.test.yml        # Nur PostgreSQL (lokale Integration)
```

### 8.2 Test-Skripte (root `package.json`)

```json
{
  "test:unit":          "npm run test:unit --prefix client",
  "test:integration":   "npm run test:integration --prefix server",
  "test:e2e":           "npm run test:e2e --prefix client",
  "test:load:login":    "docker run ... grafana/k6 run load/login-load.js",
  "test:load:projects": "docker run ... grafana/k6 run load/projects-load.js",
  "test:db:up":         "docker compose -f docker-compose.test.yml up -d --wait",
  "test:db:down":       "docker compose -f docker-compose.test.yml down -v"
}
```

---

## 9. Test Isolation

### 9.1 Unit Tests (Client)

- **Umgebung:** Reines Node.js – kein DOM, kein Netzwerk, keine externen Abhängigkeiten
- **Isolation:** Jeder Test ist eine pure Funktion ohne Seiteneffekte
- **Fake-Timer:** `jest.useFakeTimers()` in Stopwatch-Tests für deterministisches Zeitverhalten (kein echtes `Date.now()`)
- **Mock-Reset:** `clearMocks: true` – alle Mock-Zustände werden zwischen Tests zurückgesetzt
- **Asset-Stubs:** CSS/Bild-Imports werden über `moduleNameMapper` durch Stubs ersetzt

### 9.2 Integrationstests (Server)

**Global Setup** (`server/test/jest/global-setup.js`) – läuft **einmalig** vor der gesamten Suite:

1. `NODE_ENV=test` setzen
2. `DATABASE_URL` aus Umgebung lesen (Default: `localhost:5432/planka_test`)
3. Knex-Migrationen ausführen (`knex.migrate.latest()`) – idempotent
4. Baseline-Seed ausführen (Admin-User, InternalConfig)
5. Bestehende Datentabellen leeren (Überreste von vorigen Runs)
6. Sails-Anwendung hochfahren (`sails.lift()`)
7. Admin-User für Login vorbereiten (Terms-Signature, `isInitialized=true`)
8. MEMBER-User anlegen (für Autorisierungstests)
9. `TEST_BASE_URL` für Worker-Prozesse exportieren

**Per-Test Cleanup** (`server/test/support/jest-hooks.js`):

```js
afterEach(async () => clearData());  // TRUNCATE aller Datentabellen
```

```sql
-- Ausgeführt nach jedem Test:
TRUNCATE TABLE "board", "card", "list", "project", ... RESTART IDENTITY CASCADE
-- Beibehaltene Tabellen (Baseline): migration, user_account, internal_config
```

**Isolation-Garantien:**
- `maxWorkers: 1` – serielle Ausführung verhindert Race Conditions auf der geteilten Sails-Instanz
- Jeder Test startet mit exakt definierten Baseline-Daten (2 User, keine Projekte/Boards/Cards)
- String-IDs (Snowflake), echte DB-Constraints, echtes bcrypt = produktionsnah

### 9.3 E2E Tests (Playwright)

- **Stack-Isolation:** Frischer Docker-Stack pro CI-Run (`docker compose up --build --wait`)
- **Image-Quelle:** Lokaler Build aus eigenem `Dockerfile` (kein Upstream-Release-Image) – siehe Abschnitt 6 für Hintergrund und Fix
- **Browser-Isolation:** Eigener Playwright-Prozess pro Worker, eigene Browser-Session
- **Determinismus:** Locale `en-US`, `data-testid`-Attribute statt fragile CSS-Selektoren

### 9.4 Load Tests (k6)

- **Stack:** Vollständiger Docker-Stack aus lokalem Quellcode
- **k6-Container:** Läuft vollständig containerisiert (`--network host`), keine lokalen Node-Abhängigkeiten
- **Zustand:** Demo-Admin wird vor jedem Load-Run per Script initialisiert (`scripts/accept-terms.sh`)
- **Ergebnis-Export:** JSON-Summaries per `--summary-export` für CI-Artifact-Upload

---

## 10. CI/CD Pipeline

**Datei:** [`.github/workflows/tests.yml`](.github/workflows/tests.yml)

**Trigger:** Push auf `master`, Pull Requests auf `master`, manuell (`workflow_dispatch`)

```
Push / PR auf master
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│                   GitHub Actions: Tests                       │
│                                                               │
│  ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────┐      │
│  │  unit    │ │ integration  │ │   e2e    │ │   load   │      │
│  │          │ │              │ │          │ │          │      │
│  │ Node 22  │ │ Node 22      │ │ Node 22  │ │ Docker   │      │
│  │ Jest     │ │ Jest +       │ │Playwright│ │ k6       │      │
│  │          │ │ supertest    │ │ Chromium │ │          │      │
│  │          │ │ + PG 16      │ │ + full   │ │ + full   │      │
│  │          │ │ (Service)    │ │ stack    │ │ stack    │      │
│  └────┬─────┘ └──────┬───────┘ └────┬─────┘ └────┬─────┘      │
│       │              │              │            │            │
│       ▼              ▼              ▼            ▼            │
│  client-coverage  (console)  playwright-   k6-load-           │
│  (Artifact 14d)              report        summaries          │
│                              (Artifact     (Artifact          │
│                               14d)          14d)              │
└───────────────────────────────────────────────────────────────┘
```

### Job-Details

#### Job `unit` – Unit Tests

```yaml
runs-on: ubuntu-latest
working-directory: client
steps:
  - actions/setup-node@v4 (Node 22, npm cache)
  - npm ci
  - npm run test:unit
  - upload-artifact: client/coverage (14 Tage)
```

#### Job `integration` – Integrationstests

```yaml
runs-on: ubuntu-latest
working-directory: server
services:
  postgres:
    image: postgres:16-alpine
    env: { POSTGRES_DB: planka_test, POSTGRES_PASSWORD: postgres }
    options: --health-cmd "pg_isready -U postgres" --health-interval 5s --health-retries 5
env:
  DATABASE_URL: postgresql://postgres:postgres@localhost:5432/planka_test
  SECRET_KEY: ci-test-secret
  BASE_URL: http://localhost:1337
steps:
  - actions/setup-node@v4 (Node 22)
  - npm ci
  - npm run test:integration
```

PostgreSQL läuft als nativer **Service-Container** von GitHub Actions – kein Docker-in-Docker nötig, Healthcheck stellt sicher dass die DB bereit ist bevor Tests starten.

#### Job `e2e` – E2E Tests

```yaml
runs-on: ubuntu-latest
steps:
  - docker compose up -d --build --wait   # Stack aus lokalem Code bauen
  - npm ci && npx playwright install --with-deps chromium
  - E2E_BASE_URL=http://localhost:3000 npm run test:e2e
  - upload-artifact: client/playwright-report (14 Tage)
  - docker compose down -v               # immer aufräumen (if: always())
```

#### Job `load` – Load Tests

```yaml
runs-on: ubuntu-latest
steps:
  - docker compose up -d --build --wait
  - bash scripts/accept-terms.sh http://localhost:3000
  - mkdir -p load/results && chmod 777 load/results
  - docker run --rm --network host -e BASE_URL=... -v $PWD/load:/load \
      grafana/k6 run --summary-export /load/results/login-summary.json /load/login-load.js
  - docker run --rm ... /load/projects-load.js → projects-summary.json
  - upload-artifact: load/results (14 Tage)
  - docker compose down -v
```

### Weitere Workflows

| Workflow             | Datei                                     | Zweck                           |
|----------------------|-------------------------------------------|---------------------------------|
| Lint                 | `lint.yml`                                | ESLint auf Pull Requests        |
| Docker Build & Push  | `build-and-push-docker-image.yml`         | Release-Images bauen und pushen |
| Docker Nightly       | `build-and-push-docker-nightly-image.yml` | Nächtliche Builds               |
| Release Package      | `build-and-publish-release-package.yml`   | Release Artifacts               |

---

## 11. Coverage

**Client Unit Test Coverage** (automatisch durch Jest):

Coverage wird für die vier getesteten Utility-Module gemessen und als HTML/JSON-Report in `client/coverage/` gespeichert:

| Datei                        | Statements | Branches | Functions | Lines  |
|------------------------------|------------|----------|-----------|--------|
| `src/utils/validator.js`     | 100 %      | 100 %    | 100 %     | 100 %  |
| `src/utils/mentions.js`      | 100 %      | 100 %    | 100 %     | 100 %  |
| `src/utils/stopwatch.js`     | 100 %      | ~90 %    | 100 %     | 100 %  |
| `src/utils/merge-records.js` | 100 %      | 100 %    | 100 %     | 100 %  |

Coverage-Reports werden als `client-coverage`-Artifact in GitHub Actions gespeichert (14 Tage Retention) und können direkt im Browser als HTML geöffnet werden.

**Server / E2E / Load:** Keine Quellcode-Coverage – diese Ebenen messen API-Verhalten, Feature-Korrektheit und Performance, nicht Code-Pfade.

---

## 12. Zusammenfassung

| Aspekt                            | Entscheidung & Begründung                                                            |
|-----------------------------------|--------------------------------------------------------------------------------------|
| **Webanwendung**                  | Planka (Open Source, geforkt) – produktionsreifes Kanban-System mit realem Tech-Stack |
| **Unit Framework**                | Jest – modernes Framework mit `test.each`, Fake-Timern und integrierter Coverage     |
| **Integration Framework**         | Jest + supertest – gegen echtes PostgreSQL (nicht gemockt), produktionsnah           |
| **E2E Framework**                 | Playwright – stabile Browser-Automation, `data-testid`-Support, CI-ready             |
| **Load Framework**                | k6 – deklarative VU-Szenarien, Docker-native, JSON-Export für Artifact-Archivierung  |
| **Test-Isolation (Integration)**  | TRUNCATE nach jedem Test, Sails einmal hochfahren, PostgreSQL als Service-Container  |
| **Test-Isolation (E2E/Load)**     | Frischer Docker-Stack pro CI-Run, stets aus lokalem Quellcode gebaut                 |
| **CI**                            | GitHub Actions – 4 parallele Jobs, PostgreSQL Service-Container, 14-Tage-Artifacts  |
| **Upstream-Delta**                | Upstream hatte nie funktionierende Integrationstests und keine E2E/Load-Tests        |
