initPage((user) => {
  const body = document.getElementById("rows");
  const countEl = document.getElementById("count");
  const fStatus = document.getElementById("fStatus");
  const fCategory = document.getElementById("fCategory");
  let tickets = [];

  fStatus.innerHTML = `<option value="">All statuses</option>` + optionsHtml(TICKET_STATUSES);
  loadCategoryOptions(fCategory, "All categories");
  document.getElementById("reload").onclick = load;
  fStatus.onchange = load;
  fCategory.onchange = load;

  async function load() {
    body.innerHTML = `<tr><td colspan="11">${stateHtml.loading()}</td></tr>`;
    try {
      const s = fStatus.value, c = fCategory.value;
      // Use the dedicated endpoints; if both filters are set, intersect the results.
      let list;
      if (s && c) {
        const [a, b] = await Promise.all([api("/api/tickets/status/" + encodeURIComponent(s)), api("/api/tickets/category/" + encodeURIComponent(c))]);
        const ids = new Set((b || []).map((x) => x.id));
        list = (a || []).filter((x) => ids.has(x.id));
      } else if (s) list = await api("/api/tickets/status/" + encodeURIComponent(s));
      else if (c) list = await api("/api/tickets/category/" + encodeURIComponent(c));
      else list = await api("/api/tickets");
      tickets = (list || []).sort((a, b) => b.id - a.id);
      render();
    } catch (e) {
      body.innerHTML = `<tr><td colspan="11">${stateHtml.error(e.message)}</td></tr>`;
      countEl.textContent = "";
    }
  }

  function render() {
    countEl.textContent = tickets.length + (tickets.length === 1 ? " ticket" : " tickets");
    if (!tickets.length) {
      body.innerHTML = `<tr><td colspan="11">${stateHtml.empty("No tickets match the selected filters.", "fa-filter-circle-xmark")}</td></tr>`;
      return;
    }
    body.innerHTML = tickets.map((t) => `<tr data-id="${esc(t.id)}">
      <td>#${esc(t.id)}</td>
      <td>${esc(t.userName)}</td>
      <td>${esc(t.categoryName)}</td>
      <td>${esc(t.title || "—")}</td>
      <td>${esc(t.roomNo)}</td>
      <td class="desc">${esc(t.description)}</td>
      <td><select data-act="priority" aria-label="Priority">${optionsHtml(TICKET_PRIORITIES, t.priority)}</select></td>
      <td><select data-act="status" aria-label="Status">${optionsHtml(TICKET_STATUSES, t.status)}</select></td>
      <td>${fmtDate(t.createdAt)}</td>
      <td>${t.assignedToName ? esc(t.assignedToName) : '<span class="muted">Unassigned</span>'}</td>
      <td><button class="btn btn-outline btn-sm" data-act="assign"><i class="fa-solid fa-user-plus"></i> Assign</button></td>
    </tr>`).join("");
  }

  async function patch(id, qs, okMsg) {
    try {
      await api(`/api/tickets/${id}/${qs}`, { method: "PATCH" });
      toast(okMsg);
    } catch (e) {
      toast(e.message, "error");
    }
    await load(); // always refresh so the table mirrors the server
  }

  body.addEventListener("change", (e) => {
    const sel = e.target.closest("select[data-act]");
    if (!sel) return;
    const id = sel.closest("tr").dataset.id;
    if (sel.dataset.act === "status")
      patch(id, "status?status=" + encodeURIComponent(sel.value), `Ticket #${id} status set to ${sel.value.replace(/_/g, " ")}`);
    else
      patch(id, "priority?priority=" + encodeURIComponent(sel.value), `Ticket #${id} priority set to ${sel.value}`);
  });

  body.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-act=assign]");
    if (!btn) return;
    const id = btn.closest("tr").dataset.id;
    const t = tickets.find((x) => String(x.id) === id);
    const picker = `<input type="number" name="staffId" min="1" placeholder="Staff user ID" value="${user.role === "STAFF" ? esc(user.id) : ""}">
      <div class="hint">Enter the staff member's user ID. The user must have role STAFF.</div>`;
    openModal(`Assign ticket #${id}`, `<div class="field"><label>Staff member</label>${picker}</div>`, "Assign", async (form, close) => {
      const staffId = Number(form.staffId.value);
      if (!Number.isInteger(staffId) || staffId < 1) throw new Error("Enter a valid staff ID.");
      await api(`/api/tickets/${id}/assign?staffId=${encodeURIComponent(staffId)}`, { method: "PATCH" });
      close();
      toast(`Ticket #${id} assigned.`);
      load();
    });
  });

  load();
});
