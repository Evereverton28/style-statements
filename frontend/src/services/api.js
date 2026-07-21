// Base API client for the Style Statements backend.
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function token() {
  try { return localStorage.getItem("ss_token"); } catch { return null; }
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && token()) headers.Authorization = `Bearer ${token()}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
  return data;
}

export const api = {
  base: BASE,
  get: (p, auth) => request(p, { auth }),
  post: (p, body, auth) => request(p, { method: "POST", body, auth }),
  put: (p, body, auth) => request(p, { method: "PUT", body, auth }),
  patch: (p, body, auth) => request(p, { method: "PATCH", body, auth }),
  del: (p, auth) => request(p, { method: "DELETE", auth }),
};
