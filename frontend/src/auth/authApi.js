import { apiFetch } from '../api/client';
import { clearToken, setToken } from './storage';

export async function register({ name, email, password, role }) {
  return apiFetch('/user/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  });
}

export async function login({ email, password }) {
  const data = await apiFetch('/user/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data?.token) setToken(data.token);
  return data;
}

export async function getProfile() {
  return apiFetch('/user/profile', { method: 'GET', auth: true });
}

export async function updateProfile({ name, email }) {
  return apiFetch('/user/profile', {
    method: 'PUT',
    auth: true,
    body: JSON.stringify({ name, email }),
  });
}

export async function changePassword({ currentPassword, newPassword }) {
  return apiFetch('/user/change-password', {
    method: 'POST',
    auth: true,
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function logout() {
  clearToken();
}

export async function getAllUsers() {
  return apiFetch('/user/all-users', { method: 'GET', auth: true });
}

export async function deleteUser(id) {
  return apiFetch(`/user/${id}`, { method: 'DELETE', auth: true });
}

