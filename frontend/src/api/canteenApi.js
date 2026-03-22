import { apiFetch } from './client';

// Student: View all active canteens
export async function viewCanteens() {
  return apiFetch('/canteen/view-all', { auth: true });
}

// Student: Get single canteen details
export async function getCanteenDetails(canteenID) {
  return apiFetch(`/canteen/${canteenID}`, { auth: true });
}

// Admin: Create a new canteen
export async function createCanteen(data) {
  return apiFetch('/canteen/create', {
    auth: true,
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Admin: Get all canteens (including inactive)
export async function getAllCanteens() {
  return apiFetch('/canteen/admin/all', { auth: true });
}

// Admin: Update canteen
export async function updateCanteen(canteenID, data) {
  return apiFetch(`/canteen/${canteenID}`, {
    auth: true,
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Admin: Delete canteen
export async function deleteCanteen(canteenID) {
  return apiFetch(`/canteen/${canteenID}`, {
    auth: true,
    method: 'DELETE',
  });
}

// Admin: Assign manager to canteen
export async function assignManagerToCanteen(canteenID, userId) {
  return apiFetch(`/canteen/${canteenID}/assign-manager`, {
    auth: true,
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

// Admin: Add staff to canteen
export async function addStaffToCanteen(canteenID, staffId, role = 'staff') {
  return apiFetch(`/canteen/${canteenID}/add-staff`, {
    auth: true,
    method: 'POST',
    body: JSON.stringify({ staffId, role }),
  });
}

// Admin: Get staff assigned to canteen
export async function getCanteenStaff(canteenID) {
  return apiFetch(`/canteen/${canteenID}/staff`, { auth: true });
}

// Admin: Remove staff from canteen
export async function removeStaffFromCanteen(canteenID, staffId) {
  return apiFetch(`/canteen/${canteenID}/staff/${staffId}`, {
    auth: true,
    method: 'DELETE',
  });
}
