// Session handling + login/register forms.
// Only non-sensitive user info is kept (sessionStorage). Passwords are never stored.
// NOTE: front-end checks are for convenience only; the backend must enforce real authorization.

const SESSION_KEY = "uniassist_user";
const ROOT = location.pathname.includes("/pages/") ? "../" : "";

const getUser = () => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; } };

// Redirects to login if not signed in. Returns the user otherwise.
function requireAuth() {
  const u = getUser();
  if (!u || u.id == null) { location.href = ROOT + "login.html"; return null; }
  return u;
}

function logout() { sessionStorage.removeItem(SESSION_KEY); location.href = ROOT + "login.html"; }

// Backend response shape may differ slightly, so normalise it into {id,name,email,role}
function normalizeUser(raw, fallbackEmail) {
  const u = (raw && raw.user) || raw || {};
  return { id: u.id ?? u.userId, name: pick(u, "fullName", "name", "username") || fallbackEmail, email: u.email || fallbackEmail, role: u.role || "STUDENT" };
}

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
function showFormError(msg) { const e = document.getElementById("formError"); e.textContent = msg; e.style.display = msg ? "block" : "none"; }

// ----- Login -----
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  if (getUser()) location.href = "pages/dashboard.html";
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showFormError("");
    const f = loginForm;
    const ok = [validateField(f.email, emailOk(f.email.value.trim()), "Enter a valid email"),
    validateField(f.password, f.password.value.length > 0, "Password is required")].every(Boolean);
    if (!ok) return;
    const btn = f.querySelector("button");
    setLoading(btn, true, "Signing in…");
    try {
      const raw = await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email: f.email.value.trim(), password: f.password.value }) });
      const user = normalizeUser(raw, f.email.value.trim());
      if (user.id == null) throw new Error("Login succeeded but the server did not return a user id.");
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
      location.href = "pages/dashboard.html";
    } catch (err) { showFormError(err.message); setLoading(btn, false); }
  });
}

// ----- Registration -----
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showFormError("");
    const f = registerForm;
    const ok = [
      validateField(f.fullName, f.fullName.value.trim().length >= 2, "Enter your full name"),
      validateField(f.email, emailOk(f.email.value.trim()), "Enter a valid email"),
      validateField(f.password, f.password.value.length >= 6, "At least 6 characters"),
      validateField(f.confirm, f.confirm.value === f.password.value, "Passwords do not match"),
    ].every(Boolean);
    if (!ok) return;
    const btn = f.querySelector("button");
    setLoading(btn, true, "Creating account…");
    try {
      // Field names assumed: fullName, email, password, role. Adjust here if your DTO differs.
      await api("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: f.fullName.value.trim(),
          email: f.email.value.trim(),
          password: f.password.value,
          role: "STUDENT"
        })
      });
      toast("Account created! Redirecting to login…");
      setTimeout(() => (location.href = "login.html"), 1200);
    } catch (err) { showFormError(err.message); setLoading(btn, false); }
  });
}
