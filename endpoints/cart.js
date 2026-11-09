import http from 'k6/http';
import { Counter } from 'k6/metrics';
import { settings } from '../configs/options.js';

const ok200 = http.expectedStatuses(200);
const getCartRequests = new Counter('get_cart_requests');
const clientErrors = new Counter('client_errors');

function classifyError(res) {
  if (res.error_code === 1050) return 'timeout';
  if (res.status >= 500) return 'http_5xx';
  if (res.status >= 400) return 'http_4xx';
  if (res.error_code) return 'transport';
  return 'other';
}

export function getCart(cartId, phase) {
  const res = http.get(
    `${settings.baseUrl}/carts/${encodeURIComponent(cartId)}`,
    {
      headers: { Accept: 'application/json' },
      redirects: 0,
      timeout: '10s',
      tags: {
        name: 'GET /carts/{id}',
        endpoint: 'get_cart',
        phase,
      },
      responseCallback: ok200,
    },
  );

  getCartRequests.add(1, { endpoint: 'get_cart', phase });

  if (res.status !== 200 || res.error_code) {
    clientErrors.add(1, {
      endpoint: 'get_cart',
      category: classifyError(res),
      phase,
    });
  }

  return res;
}