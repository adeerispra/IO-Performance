import { check } from 'k6';
import exec from 'k6/execution';
import { options as testOptions, settings } from '../configs/options.js';
import { setupCart } from '../helpers/setup-cart.js';
import { getCart } from '../endpoints/cart.js';

export const options = testOptions;

function getPhase() {
  if (settings.profile !== 'load') return 'rehearsal';

  const elapsed = Date.now() - exec.scenario.startTime;
  if (elapsed < 60_000) return 'normal';
  if (elapsed < 180_000) return 'ramp';
  if (elapsed < 240_000) return 'peak';
  if (elapsed < 300_000) return 'rampdown';
  return 'recovery';
}

function parseJson(res) {
  try {
    return res.json();
  } catch (_) {
    return null;
  }
}

export function setup() {
  return setupCart();
}

export default function (data) {
  const phase = getPhase();
  const res = getCart(data.cartId, phase);
  const cart = parseJson(res);

  check(res, {
    'HTTP 200': (r) => r.status === 200,
    'cart ID matches': () => cart && cart.id === data.cartId,
    'exactly one valid item': () => {
      if (!cart || !Array.isArray(cart.cart_items) ||
          cart.cart_items.length !== 1) {
        return false;
      }

      const item = cart.cart_items[0];
      return item
        && item.cart_id === data.cartId
        && item.product_id === data.productId
        && item.product
        && item.product.id === data.productId
        && item.product.name === data.productName
        && item.quantity === 1
        && Number.isFinite(Number(item.product.price))
        && Number(item.product.price) === settings.expectedPrice;
    },
  }, { endpoint: 'get_cart', phase });
}