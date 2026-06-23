# Load tests (k6)

Load tests are written for [k6](https://k6.io/). Unlike the Jest/Playwright
suites, k6 is a standalone binary and is **not** installed via npm.

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

## Run a load test

```bash
npm run test:load                         # runs load/smoke.js against localhost:3000
BASE_URL=http://localhost:3000 k6 run load/smoke.js
```

Override the target with the `BASE_URL` environment variable.

## Exporting results for the report

```bash
mkdir -p load/results
k6 run --summary-export load/results/smoke-summary.json load/smoke.js
```
