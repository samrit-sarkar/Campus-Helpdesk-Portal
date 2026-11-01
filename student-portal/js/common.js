
// Shared helpers + sidebar/topbar rendering

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "fa-gauge", href: "dashboard.html" },
  { sep: "Maintenance" },
  { key: "create-ticket", label: "New Ticket", icon: "fa-screwdriver-wrench", href: "create-ticket.html" },
  { key: "my-tickets", label: "My Tickets", icon: "fa-ticket", href: "my-tickets.html" },
  { sep: "Lost & Found" },
  { key: "lost-found", label: "Browse Items", icon: "fa-magnifying-glass", href: "lost-found.html" },
  { key: "report-lost", label: "Report Lost", icon: "fa-circle-question", href: "report-lost.html" },
  { key: "report-found", label: "Report Found", icon: "fa-hand-holding-heart", href: "report-found.html" }
];

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

const pick = (o, ...keys) => {
  for (const k of keys) {
    if (o && o[k] != null) return o[k];
  }
  return null;
};

function fmtDate(v) {
  const d = v ? new Date(v) : null;
  return d && !isNaN(d)
    ? d.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : "—";
}

function badge(text) {
  const t = String(text || "unknown");
  return `<span class="badge badge-${esc(t.toLowerCase().replace(/_/g, "-"))}">${esc(t.replace(/_/g, " "))}</span>`;
}

function toast(msg, type = "success") {
  const container = document.getElementById("toasts");

  if (!container) {
    console.log(msg);
    return;
  }

  const el = document.createElement("div");
  el.className = "toast " + type;
  el.textContent = msg;
  container.appendChild(el);

  setTimeout(() => el.remove(), 4500);
}

const stateHtml = {
  loading: (m = "Loading…") =>
    `<div class="state"><div class="spinner"></div>${esc(m)}</div>`,

  empty: (m, icon = "fa-inbox") =>
    `<div class="state"><i class="fa-solid ${icon}"></i>${esc(m)}</div>`,

  error: (m) =>
    `<div class="state"><i class="fa-solid fa-triangle-exclamation"></i>${esc(m)}</div>`
};

function setLoading(btn, on, label) {
  if (on) {
    btn.dataset.label = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML =
      '<i class="fa-solid fa-spinner fa-spin"></i> ' +
      (label || "Please wait…");
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.label || btn.innerHTML;
  }
}

function validateField(input, ok, message) {
  const field = input.closest(".field");

  if (!field) return ok;

  field.classList.toggle("invalid", !ok);

  const m = field.querySelector(".err-msg");

  if (m && message) {
    m.textContent = message;
  }

  return ok;
}

// Load categories from Spring Boot
async function loadCategories(select) {
  if (!select) {
    console.error("Category dropdown not found");
    return;
  }

  select.innerHTML =
    '<option value="">Loading categories...</option>';

  try {
    const list = await api("/api/categories");

    select.innerHTML =
      '<option value="">Select a category</option>';

    if (!Array.isArray(list) || list.length === 0) {
      select.innerHTML =
        '<option value="">No categories available</option>';
      return;
    }

    list.forEach((category) => {
      const option = document.createElement("option");

      option.value = category.id;
      option.textContent =
        pick(category, "name", "categoryName", "title") ||
        "Unnamed category";

      select.appendChild(option);
    });

  } catch (error) {
    console.error("Category loading failed:", error);

    select.innerHTML =
      '<option value="">Could not load categories</option>';

    toast(error.message, "error");
  }
}

function renderLayout() {
  const user = getUser();
  if (!user) return;

  const page = document.body.dataset.page;

  const sidebar = document.getElementById("sidebar");
  const topbar = document.getElementById("topbar");

  if (!sidebar || !topbar) return;

  sidebar.innerHTML =
    `<div class="brand">
      <i class="fa-solid fa-graduation-cap"></i> UniAssist
    </div>
    <nav class="nav">` +
    NAV.map((n) =>
      n.sep
        ? `<div class="sep">${n.sep}</div>`
        : `<a href="${n.href}"
             class="${n.key === page || (page === "item-details" && n.key === "lost-found") ? "active" : ""}">
             <i class="fa-solid ${n.icon}"></i>${n.label}
           </a>`
    ).join("") +
    `</nav>`;

  topbar.innerHTML =
    `<button class="menu-btn" aria-label="Menu">
      <i class="fa-solid fa-bars"></i>
    </button>
    <span></span>
    <div class="profile">
      <div>
        <b>${esc(user.name)}</b>
        <small>${esc(user.role || "STUDENT")}</small>
      </div>
      <div class="avatar">
        ${esc((user.name || "S").trim().charAt(0).toUpperCase())}
      </div>
      <button class="btn btn-outline btn-sm" id="logoutBtn">
        <i class="fa-solid fa-right-from-bracket"></i> Logout
      </button>
    </div>`;

  document.querySelector(".menu-btn").onclick = () =>
    sidebar.classList.toggle("open");

  document.getElementById("logoutBtn").onclick = logout;
}

// Protected pages
if (document.body.dataset.page) {
  document.addEventListener("DOMContentLoaded", () => {
    if (requireAuth()) {
      renderLayout();
    }
  });
}
