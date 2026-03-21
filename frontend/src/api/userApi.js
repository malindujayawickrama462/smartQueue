import { apiFetch } from './client';

// Admin: Get all users
export async function getAllUsers() {
  return apiFetch('/user/all-users', { auth: true });
}
