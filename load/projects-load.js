import http from 'k6/http';
import { check } from 'k6';
import { Trend } from 'k6/metrics';

/*
 * LOAD TEST 2 — Authenticated read load (owner: Vučetić)
 *
 * Logs in once in setup() to obtain an access token, then hammers the
 * "list projects" endpoint as many concurrent users would when browsing. This
 * is a read-heavy scenario and a good baseline for typical app usage.
 *
 * Run:  npm run test:load:projects   (or BASE_URL=... k6 run load/projects-load.js)
 */

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const listDuration = new Trend('list_projects_duration', true);

export const options = {
  stages: [
    { duration: '10s', target: 30 },
    { duration: '20s', target: 30 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    list_projects_duration: ['p(95)<500'], // reads should be fast: p95 < 500ms
  },
};

// Runs once before the load: authenticate and share the token with all VUs.
export function setup() {
  const res = http.post(
    `${BASE_URL}/api/access-tokens`,
    JSON.stringify({ emailOrUsername: 'demo', password: 'demo' }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(res, { 'login succeeded': (r) => r.status === 200 });
  return { token: res.json('item') };
}

export default function (data) {
  const params = { headers: { Authorization: `Bearer ${data.token}` } };

  const res = http.get(`${BASE_URL}/api/projects`, params);
  listDuration.add(res.timings.duration);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'returns items array': (r) => Array.isArray(r.json('items')),
  });
}
