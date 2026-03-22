import { apiFetch } from './client';

export async function createOrder(canteenID) {
  return apiFetch('/orders', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ canteenID }),
  });
}
