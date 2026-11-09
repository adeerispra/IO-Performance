const profile = __ENV.PROFILE;
const productName = __ENV.PRODUCT_NAME || 'Pliers';
const expectedPrice = Number(__ENV.EXPECTED_PRICE || '12.01');
const p95Ms = Number(__ENV.P95_MS || '500');
const p99Ms = Number(__ENV.P99_MS || '1000');
const baseUrl = (__ENV.BASE_URL || '').replace(/\/+$/, '');

if (!['rehearsal', 'load'].includes(profile)) {
  throw new Error('PROFILE must be rehearsal or load');
}

if (!(Number.isFinite(expectedPrice) && expectedPrice > 0)) {
  throw new Error('EXPECTED_PRICE must be a positive number');
}

if (!(Number.isFinite(p95Ms) && p95Ms > 0 &&
      Number.isFinite(p99Ms) && p99Ms > 0)) {
  throw new Error('P95_MS and P99_MS must be positive numbers');
}

export const settings = {
  profile,
  productName,
  expectedPrice,
  p95Ms,
  p99Ms,
  baseUrl,
};

export const options = {
  systemTags: [
    'status', 'method', 'name', 'scenario',
    'expected_response', 'error', 'error_code',
  ],
  summaryTrendStats: [
    'avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'count',
  ],
  scenarios: profile === 'load' ? {
    get_cart: {
      executor: 'ramping-arrival-rate',
      startRate: 5,
      timeUnit: '1s',
      preAllocatedVUs: 20,
      maxVUs: 50,
      stages: [
        { duration: '1m', target: 5 },
        { duration: '2m', target: 20 },
        { duration: '1m', target: 20 },
        { duration: '1m', target: 5 },
        { duration: '1m', target: 5 },
      ],
      gracefulStop: '20s',
    },
  } : {
    get_cart_rehearsal: {
      executor: 'shared-iterations',
      vus: 1,
      iterations: 1,
      maxDuration: '30s',
    },
  },
  thresholds: profile === 'load' ? {
    'http_req_duration{endpoint:get_cart}': [
      `p(95)<${p95Ms}`,
      `p(99)<${p99Ms}`,
    ],
    'http_req_failed{endpoint:get_cart}': ['rate<0.01'],
    checks: ['rate==1'],
    dropped_iterations: ['count==0'],
  } : {
    checks: ['rate==1'],
    'http_req_duration{endpoint:get_cart}': [],
  },
};