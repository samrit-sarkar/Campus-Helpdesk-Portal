// Central API configuration + fetch wrapper. Change API_BASE_URL if the backend runs elsewhere.
const API_BASE_URL = "http://localhost:8080";

/** Returns parsed JSON (or null for empty responses). Throws Error with a readable message. */
async function api(path, options = {}) {
  let res;
  try {
    res = await fetch(API_BASE_URL + path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) }
    });
  } catch (e) {
    throw new Error("Cannot reach the server. Check that the backend is running at " + API_BASE_URL + ".");
  }
  const text = await res.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }
  if (!res.ok) {
    const serverMsg = data && typeof data === "object" && (data.message || data.error);
    if (serverMsg) throw new Error(serverMsg);
    if (typeof data === "string" && data.length < 200) throw new Error(data);
    if (res.status === 404) throw new Error("Not found (404). It may have been deleted.");
    throw new Error(res.status >= 500 ? "Server error. Please try again later." : "Request failed (" + res.status + "). Please check your input.");
  }
  return data;
}

// Values accepted by the backend
const TICKET_STATUSES = ["PENDING", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];
const TICKET_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];
const ITEM_STATUSES = ["OPEN", "CLAIM_REQUESTED", "VERIFIED", "RESOLVED"];
const ITEM_TYPES = ["LOST", "FOUND"];
