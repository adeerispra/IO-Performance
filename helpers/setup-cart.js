import http from 'k6/http';
import { settings } from '../configs/options.js';

const ok200 = http.expectedStatuses(200);
const ok201 = http.expectedStatuses(201);

function parseJson(res) {
  try {
    return res.json();
  } catch (_) {
    return null;
  }
}

function setupRequest(method, path, body, expected, name) {
  return http.request(
    method,
    `${settings.baseUrl}${path}`,
    body === undefined ? null : JSON.stringify(body),
    {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      redirects: 0,
      timeout: '10s',
      tags: { name, endpoint: 'setup', phase: 'setup' },
      responseCallback: expected,
    },
  );
}

export function setupCart() {
  let page = 1;
  let lastPage = 1;
  let product = null;

  do {
    const res = setupRequest(
      'GET', `/products?page=${page}`, undefined,
      ok200, 'SETUP GET /products',
    );

    if (res.status !== 200) {
      throw new Error(`Product lookup failed HTTP ${res.status}`);
    }

    const data = parseJson(res);
    if (!data || !Array.isArray(data.data)) {
      throw new Error('Invalid /products response');
    }

    lastPage = Number(data.last_page);
    if (!(Number.isInteger(lastPage) && lastPage >= page)) {
      throw new Error('Invalid last_page');
    }

    product = data.data.find(
      (p) => p && p.name === settings.productName,
    ) || null;

    page += 1;
  } while (!product && page <= lastPage);

  if (!product || !product.id) {
    throw new Error(`Product "${settings.productName}" not found`);
  }

  const createRes = setupRequest(
    'POST', '/carts', {}, ok201, 'SETUP POST /carts',
  );
  const created = parseJson(createRes);

  if (createRes.status !== 201 || !created ||
      typeof created.id !== 'string' || !created.id) {
    throw new Error('Setup Create Cart failed');
  }

  const addRes = setupRequest(
    'POST',
    `/carts/${encodeURIComponent(created.id)}`,
    { product_id: product.id, quantity: 1 },
    ok200,
    'SETUP POST /carts/{id}',
  );
  const added = parseJson(addRes);

  if (addRes.status !== 200 || !added ||
      added.result !== 'item added or updated') {
    throw new Error('Setup Add Product failed');
  }

  return {
    cartId: created.id,
    productId: product.id,
    productName: settings.productName,
  };
}