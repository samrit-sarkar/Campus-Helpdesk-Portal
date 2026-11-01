// Lost & Found: listing, report form and item details.
// Uses GET/POST /api/lost-found. No claim/contact endpoint exists, so none is faked.
document.addEventListener("DOMContentLoaded", () => {
  const user = getUser();
  if (!user) return;
  const dateOf = (i) => pick(i, "createdAt", "reportedAt", "dateReported", "reportedDate");
  const catName = (i) => pick(i.category, "name", "categoryName") || "Uncategorised";

  // ===== Report form (shared by report-lost and report-found) =====
  const form = document.getElementById("reportForm");
  if (form) {
    const type = form.dataset.type; // "LOST" or "FOUND" – fixed by the page, not user-editable
    loadCategories(form.category);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const ok = [
        validateField(form.itemName, form.itemName.value.trim().length >= 2, "Item name is required"),
        validateField(form.description, form.description.value.trim().length >= 5, "Add a short description"),
        validateField(form.location, form.location.value.trim().length > 0, "Location is required"),
        validateField(form.category, !!form.category.value, "Select a category"),
      ].every(Boolean);
      if (!ok) return;
      const btn = form.querySelector("button[type=submit]");
      setLoading(btn, true, "Submitting…");
      try {
        await api("/api/lost-found", { method: "POST", body: JSON.stringify({
          user: { id: user.id }, category: { id: Number(form.category.value) },
          itemName: form.itemName.value.trim(), description: form.description.value.trim(),
          location: form.location.value.trim(), type, imagePath: null }) });
        toast("Your " + type.toLowerCase() + " item report was submitted.");
        setTimeout(() => (location.href = "lost-found.html"), 1200);
      } catch (err) { toast(err.message, "error"); setLoading(btn, false); }
    });
  }

  // ===== Listing =====
  const grid = document.getElementById("itemsGrid");
  if (grid) {
    const f = { type: "ALL", q: "", cat: "", status: "" };
    let items = [];
    const catSel = document.getElementById("fCategory"), statusSel = document.getElementById("fStatus");
    function draw() {
      const rows = items.filter((i) =>
        (f.type === "ALL" || i.type === f.type) && (!f.cat || String(pick(i.category, "id")) === f.cat) &&
        (!f.status || i.status === f.status) && String(i.itemName || "").toLowerCase().includes(f.q.toLowerCase()));
      grid.style.display = rows.length ? "" : "block";
      grid.innerHTML = rows.length ? rows.map((i) => `
        <a class="card item" href="item-details.html?id=${encodeURIComponent(i.id)}" style="color:inherit">
          <div class="row">${badge(i.type)}${badge(i.status)}</div>
          <h4>${esc(i.itemName)}</h4><p>${esc(i.description)}</p>
          <div class="meta"><span><i class="fa-solid fa-location-dot"></i> ${esc(i.location)}</span>
            <span><i class="fa-solid fa-tag"></i> ${esc(catName(i))}</span>
            <span><i class="fa-regular fa-calendar"></i> ${fmtDate(dateOf(i))}</span></div>
        </a>`).join("") : stateHtml.empty(items.length ? "No items match your filters." : "No items have been reported yet.", "fa-box-open");
    }
    document.querySelectorAll("#typeChips .chip").forEach((c) => c.onclick = () => {
      f.type = c.dataset.type; document.querySelectorAll("#typeChips .chip").forEach((x) => x.classList.toggle("active", x === c)); draw(); });
    document.getElementById("fSearch").oninput = (e) => { f.q = e.target.value; draw(); };
    catSel.onchange = () => { f.cat = catSel.value; draw(); };
    statusSel.onchange = () => { f.status = statusSel.value; draw(); };

    grid.style.display = "block";
    grid.innerHTML = stateHtml.loading("Loading items…");
    api("/api/lost-found").then((d) => {
      items = (d || []).sort((a, b) => (b.id || 0) - (a.id || 0));
      // Filter options are built from real data, so no status values are assumed
      const cats = new Map(items.filter((i) => i.category).map((i) => [String(i.category.id), catName(i)]));
      catSel.innerHTML = '<option value="">All categories</option>' + [...cats].map(([id, n]) => `<option value="${esc(id)}">${esc(n)}</option>`).join("");
      statusSel.innerHTML = '<option value="">All statuses</option>' + [...new Set(items.map((i) => i.status).filter(Boolean))].map((s) => `<option value="${esc(s)}">${esc(s.replace(/_/g, " "))}</option>`).join("");
      draw();
    }).catch((e) => (grid.innerHTML = stateHtml.error(e.message)));
  }

  // ===== Details =====
  const box = document.getElementById("itemDetails");
  if (box) {
    const id = new URLSearchParams(location.search).get("id");
    box.innerHTML = stateHtml.loading();
    // No "get by id" endpoint is listed, so the item is found in the full list.
    api("/api/lost-found").then((d) => {
      const i = (d || []).find((x) => String(x.id) === id);
      if (!i) { box.innerHTML = stateHtml.empty("Item not found.", "fa-circle-question"); return; }
      const reporter = pick(i.user, "fullName", "name");
      box.innerHTML = `
        <div style="display:flex;gap:8px">${badge(i.type)}${badge(i.status)}</div>
        <h2 style="margin-top:10px">${esc(i.itemName)}</h2>
        <dl><dt>Description</dt><dd>${esc(i.description)}</dd>
          <dt>${i.type === "LOST" ? "Last seen at" : "Found at"}</dt><dd>${esc(i.location)}</dd>
          <dt>Category</dt><dd>${esc(catName(i))}</dd>
          <dt>Date reported</dt><dd>${fmtDate(dateOf(i))}</dd>
          ${reporter ? `<dt>Reported by</dt><dd>${esc(reporter)}</dd>` : ""}
          <dt>Image</dt><dd>No image available</dd></dl>
        <div class="notice"><i class="fa-solid fa-circle-info"></i> Claim requests and contacting the reporter are not available yet because the backend does not support them. Please contact the university helpdesk about this item.</div>`;
    }).catch((e) => (box.innerHTML = stateHtml.error(e.message)));
  }
});
