// Session handling for the staff/admin portal.
// NOTE: these checks only hide pages for convenience. Real authorization MUST be enforced by the backend.
const SESSION_KEY = "uniassist_staff";
const ALLOWED_ROLES = ["STAFF", "ADMIN"];
const ROOT = location.pathname.includes("/pages/") ? "../" : "";

const getUser = () => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; } };

function requireAuth() {
  const u = getUser();
  if (!u || u.id == null || !ALLOWED_ROLES.includes(String(u.role).toUpperCase())) {
    location.href = ROOT + "login.html";
    return null;
  }
  return u;
}
function logout() { sessionStorage.removeItem(SESSION_KEY); location.href = ROOT + "login.html"; }

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  const errBox = document.getElementById("formError");
  const showErr = (m) => { errBox.textContent = m; errBox.style.display = m ? "block" : "none"; };
  const mark = (input, ok, msg) => {
    const f = input.closest(".field");
    f.classList.toggle("invalid", !ok);
    if (msg) f.querySelector(".err-msg").textContent = msg;
    return ok;
  };
  if (requireAuthSilent()) location.href = "pages/dashboard.html";

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showErr("");
    const f = loginForm;
    const email = f.email.value.trim();
    const ok = [mark(f.email, emailOk(email), "Enter a valid email"),
                mark(f.password, f.password.value.length > 0, "Password is required")].every(Boolean);
    if (!ok) return;
    const btn = f.querySelector("button");
    const label = btn.innerHTML;
    btn.disabled = true; btn.textContent = "Signing in…";
    try {
      const u = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password: f.password.value }) });
      if (!u || u.id == null) throw new Error("Login succeeded but the server did not return a user id.");
      const role = String(u.role || "").toUpperCase();
      if (!ALLOWED_ROLES.includes(role)) throw new Error("This portal is for staff/admin accounts only.");
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: u.id, name: u.name || email, email: u.email || email, role }));
      location.href = "pages/dashboard.html";
    } catch (err) {
      showErr(err.message);
      btn.disabled = false; btn.innerHTML = label;
    }
  });
}
function requireAuthSilent() {
  const u = getUser();
  return !!(u && u.id != null && ALLOWED_ROLES.includes(String(u.role).toUpperCase()));
}
