# Load tests (k6)

Load tests are written for [k6](https://k6.io/). Unlike the Jest/Playwright
suites, k6 is a standalone binary and is **not** installed via npm.

There are two scenarios:

- `login-load.js` — login throughput (write-ish: bcrypt + JWT + session insert).
- `projects-load.js` — authenticated read load on the "list projects" endpoint.

## Install k6

```bash
brew install k6          # macOS
# or see https://grafana.com/docs/k6/latest/set-up/install-k6/
```

## Run the stack

Load tests run against a running PLANKA instance. The simplest option is the
docker-compose stack (exposes the app on http://localhost:3000):

```bash
npm run stack:up         # docker compose up -d --wait
```

A freshly started instance requires the admin to accept the terms before the
login API returns a token. Initialize it once:

```bash
bash scripts/accept-terms.sh http://localhost:3000
```

## Run the load tests

```bash
npm run test:load                 # runs both scenarios against localhost:3000
npm run test:load:login           # only login-load.js
npm run test:load:projects        # only projects-load.js

# or directly, overriding the target:
BASE_URL=http://localhost:3000 k6 run load/login-load.js
BASE_URL=http://localhost:3000 k6 run load/projects-load.js
```

## Exporting results for the report

```bash
mkdir -p load/results
k6 run --summary-export load/results/login-summary.json load/login-load.js
k6 run --summary-export load/results/projects-summary.json load/projects-load.js
```

`load/results/` is gitignored; use the exported JSON summaries (p95, error rate,
throughput) for the visualization and analysis in `REPORT.md`.
