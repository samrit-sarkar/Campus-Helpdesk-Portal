// Shared helpers: layout, escaping, badges, toasts, modal, states.
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "fa-gauge", href: "dashboard.html" },
  { sep: "Manage" },
  { key: "tickets", label: "Tickets", icon: "fa-ticket", href: "tickets.html" },
  { key: "categories", label: "Categories", icon: "fa-tags", href: "categories.html" },
  { key: "lost-found", label: "Lost & Found", icon: "fa-magnifying-glass", href: "lost-found.html" }
];

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function fmtDate(v) {
  const d = v ? new Date(v) : null;
  return d && !isNaN(d) ? d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
}
function badge(text) {
  const t = String(text || "unknown");
  return `<span class="badge badge-${esc(t.toLowerCase().replace(/_/g, "-"))}">${esc(t.replace(/_/g, " "))}</span>`;
}
function toast(msg, type = "success") {
  const c = document.getElementById("toasts");
  if (!c) return console.log(msg);
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.remove(), 4500);
}
const stateHtml = {
  loading: (m = "Loading…") => `<div class="state"><div class="spinner"></div>${esc(m)}</div>`,
  empty: (m, icon = "fa-inbox") => `<div class="state"><i class="fa-solid ${icon}"></i>${esc(m)}</div>`,
  error: (m) => `<div class="state"><i class="fa-solid fa-triangle-exclamation"></i>${esc(m)}</div>`
};
const optionsHtml = (values, selected) =>
  values.map((v) => `<option value="${esc(v)}"${v === selected ? " selected" : ""}>${esc(v.replace(/_/g, " "))}</option>`).join("");

/** Opens a modal. bodyHtml is trusted markup (escape user data!). onSubmit(formEl, close) may be async. */
function openModal(title, bodyHtml, submitLabel, onSubmit) {
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.innerHTML = `<form class="modal" novalidate><h3>${esc(title)}</h3><div class="form-error" data-err></div>${bodyHtml}
    <div class="row"><button type="button" class="btn btn-outline" data-cancel>Cancel</button>
    <button type="submit" class="btn">${esc(submitLabel)}</button></div></form>`;
  document.body.appendChild(bg);
  const form = bg.querySelector("form");
  const err = bg.querySelector("[data-err]");
  const close = () => bg.remove();
  bg.querySelector("[data-cancel]").onclick = close;
  bg.addEventListener("mousedown", (e) => { if (e.target === bg) close(); });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.style.display = "none";
    const btn = form.querySelector("[type=submit]");
    btn.disabled = true;
    try { await onSubmit(form, close); }
    catch (ex) { err.textContent = ex.message; err.style.display = "block"; btn.disabled = false; }
  });
  const first = form.querySelector("input,select,textarea");
  if (first) first.focus();
}

function renderLayout() {
  const user = getUser();
  const page = document.body.dataset.page;
  const sidebar = document.getElementById("sidebar");
  const topbar = document.getElementById("topbar");
  sidebar.innerHTML = `<div class="brand"><i class="fa-solid fa-graduation-cap"></i> UniAssist</div><nav class="nav">` +
    NAV.map((n) => n.sep ? `<div class="sep">${n.sep}</div>`
      : `<a href="${n.href}" class="${n.key === page ? "active" : ""}"><i class="fa-solid ${n.icon}"></i>${n.label}</a>`).join("") + `</nav>`;
  topbar.innerHTML = `<button class="menu-btn" aria-label="Menu"><i class="fa-solid fa-bars"></i></button><span></span>
    <div class="profile"><div><b>${esc(user.name)}</b><small>${esc(user.role)}</small></div>
    <div class="avatar">${esc((user.name || "A").trim().charAt(0).toUpperCase())}</div>
    <button class="btn btn-outline btn-sm" id="logoutBtn"><i class="fa-solid fa-right-from-bracket"></i> Logout</button></div>`;
  topbar.querySelector(".menu-btn").onclick = () => sidebar.classList.toggle("open");
  document.getElementById("logoutBtn").onclick = logout;
}

/** Page bootstrap: guard + layout, then run init(user). */
function initPage(init) {
  document.addEventListener("DOMContentLoaded", () => {
    const user = requireAuth();
    if (!user) return;
    renderLayout();
    init(user);
  });
}

async function loadCategoryOptions(select, firstLabel) {
  try {
    const list = await api("/api/categories");
    select.innerHTML = `<option value="">${esc(firstLabel)}</option>` +
      (list || []).map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");
  } catch (e) {
    toast(e.message, "error");
  }
}
