import http from 'k6/http';
import { check, sleep } from 'k6';

/*
 * SMOKE LOAD TEST (k6)
 *
 * Proves the k6 setup works against a running PLANKA stack. A handful of virtual
 * users repeatedly request the public bootstrap endpoint and we assert the
 * service stays healthy and fast. Real, scenario-based load tests are added in
 * a later phase.
 *
 * Run with:  k6 run load/smoke.js
 * Target override:  BASE_URL=http://localhost:3000 k6 run load/smoke.js
 */

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
  vus: 5,
  duration: '15s',
  thresholds: {
    http_req_failed: ['rate<0.01'], // <1% of requests may fail
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/api/bootstrap`);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'body has item': (r) => r.body.includes('item'),
  });

  sleep(1);
}
