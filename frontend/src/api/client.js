const API_BASE = '/api';

function getToken() {
  try {
    return localStorage.getItem('smartqueue_token');
  } catch {
    return null;
  }
}

export async function apiFetch(path, { auth = false, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');

  if (auth) {
    const token = getToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const msg = typeof data === 'object' && data && 'msg' in data ? data.msg : 'Request failed';
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

