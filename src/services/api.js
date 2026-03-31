import { getToken } from "../utils/auth";

// const BASE_URL = "https://14grftw2-3212.asse.devtunnels.ms/api"; /* URL Port Forward Lama  */
// const BASE_URL =
//   "https://abracodebraasset.fedorajuandy.my.id/api"; /* URL Baru  */
const BASE_URL = "http://localhost:3000";

async function request(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    method: options.method || "GET",
    headers,
    ...(options.body && { body: JSON.stringify(options.body) }),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, config);

  if (!res.ok) {
    // error handler rapi bro
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || "API Error");
  }

  return res.json();
}

export const api = {
  get: (endpoint, opts) => request(endpoint, { ...opts, method: "GET" }),
  post: (endpoint, body, opts) =>
    request(endpoint, { ...opts, method: "POST", body }),
  put: (endpoint, body, opts) =>
    request(endpoint, { ...opts, method: "PUT", body }),
  delete: (endpoint, opts) => request(endpoint, { ...opts, method: "DELETE" }),
};
