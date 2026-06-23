import http from 'k6/http';
import { check } from 'k6';
import { Trend } from 'k6/metrics';

/*
 * LOAD TEST 1 — Login throughput (owner: Merl)
 *
 * Simulates many users authenticating at the same time. Authentication is one of
 * the most expensive endpoints (bcrypt + JWT signing + a DB session insert), so
 * it is the most interesting target for a write-ish load test.
 *
 * Run:  npm run test:load:login   (or BASE_URL=... k6 run load/login-load.js)
 */

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const loginDuration = new Trend('login_duration', true);

export const options = {
  // Ramp up to 20 concurrent users, hold, then ramp down.
  stages: [
    { duration: '10s', target: 20 },
    { duration: '20s', target: 20 },
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% requests may fail
    login_duration: ['p(95)<1000'], // 95% of logins under 1s
  },
};

export default function () {
  const payload = JSON.stringify({ emailOrUsername: 'demo', password: 'demo' });
  const params = { headers: { 'Content-Type': 'application/json' } };

  const res = http.post(`${BASE_URL}/api/access-tokens`, payload, params);
  loginDuration.add(res.timings.duration);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'returns a token': (r) => typeof r.json('item') === 'string',
  });
}
