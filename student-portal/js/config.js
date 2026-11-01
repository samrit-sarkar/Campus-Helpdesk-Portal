// Central API configuration. Change API_BASE_URL if your backend runs elsewhere.
const API_BASE_URL = "http://localhost:8080";

/**
 * Wrapper around fetch. Returns parsed JSON (or null for empty responses).
 * Throws an Error with a user-friendly message for network / 4xx / 5xx failures.
 */
async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(API_BASE_URL + path, { headers: { "Content-Type": "application/json" }, ...options });
  } catch (e) {
    throw new Error("Cannot reach the server. Check that the backend is running at " + API_BASE_URL + ".");
  }
  const text = await res.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  if (!res.ok) {
    const serverMsg = data && (data.message || data.error);
    if (serverMsg) throw new Error(serverMsg);
    if (typeof data === "string" && data.length < 200) throw new Error(data);
    throw new Error(res.status >= 500 ? "Server error. Please try again later." : "Request failed (" + res.status + "). Please check your input.");
  }
  return data;
}
