// The only module that talks to the backend. Every request sends the session
// cookie, and every failure becomes an ApiError carrying the server's messages.

export class ApiError extends Error {
  constructor(status, errors) {
    super(errors.join(" "));
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const options = { method, credentials: "include", headers: {} };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`/api${path}`, options);
  } catch {
    throw new ApiError(0, [
      "Could not reach the server. Check your connection and try again.",
    ]);
  }

  if (response.status === 204) {
    return null;
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errors =
      Array.isArray(data?.errors) && data.errors.length > 0
        ? data.errors
        : [`Request failed with status ${response.status}.`];
    throw new ApiError(response.status, errors);
  }
  return data;
}

// Returns the logged in user, or null when nobody is logged in.
export async function getMe() {
  try {
    const data = await request("/auth/me");
    return data.user;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      return null;
    }
    throw err;
  }
}

export async function login({ email, password }) {
  const data = await request("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  return data.user;
}

export async function register({ name, email, password }) {
  const data = await request("/auth/register", {
    method: "POST",
    body: { name, email, password },
  });
  return data.user;
}

export function logout() {
  return request("/auth/logout", { method: "POST" });
}

const LIST_PARAMS = [
  "q",
  "type",
  "environment",
  "owner",
  "status",
  "sort",
  "page",
  "limit",
];

// Builds a query string from known, non-empty parameters only; the server
// rejects anything else.
function queryString(params, allowed) {
  const search = new URLSearchParams();
  for (const key of allowed) {
    const value = params[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      search.set(key, String(value).trim());
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function listAssets(params) {
  return request(`/assets${queryString(params, LIST_PARAMS)}`);
}

export function getSummary() {
  return request("/assets/summary");
}

function assetBody({ name, type, environment, owner, expiresAt, notes }) {
  return { name, type, environment, owner, expiresAt, notes };
}

export async function createAsset(asset) {
  const data = await request("/assets", {
    method: "POST",
    body: assetBody(asset),
  });
  return data.asset;
}

// PUT replaces the whole asset, so every field is always sent.
export async function updateAsset(id, asset) {
  const data = await request(`/assets/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: assetBody(asset),
  });
  return data.asset;
}

export function deleteAsset(id) {
  return request(`/assets/${encodeURIComponent(id)}`, { method: "DELETE" });
}

const RENEWAL_LIST_PARAMS = [
  "q",
  "type",
  "renewedBy",
  "from",
  "to",
  "page",
  "limit",
];

export function listRenewals(params) {
  return request(`/renewals${queryString(params, RENEWAL_LIST_PARAMS)}`);
}

function renewalBody({
  assetName,
  type,
  newExpiryDate,
  renewedBy,
  renewedAt,
  notes,
}) {
  return { assetName, type, newExpiryDate, renewedBy, renewedAt, notes };
}

export async function createRenewal(renewal) {
  const data = await request("/renewals", {
    method: "POST",
    body: renewalBody(renewal),
  });
  return data.renewal;
}

// PUT replaces the whole renewal, so every field is always sent.
export async function updateRenewal(id, renewal) {
  const data = await request(`/renewals/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: renewalBody(renewal),
  });
  return data.renewal;
}

export function deleteRenewal(id) {
  return request(`/renewals/${encodeURIComponent(id)}`, { method: "DELETE" });
}
