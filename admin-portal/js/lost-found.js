initPage(() => {
  const body = document.getElementById("rows");
  const countEl = document.getElementById("count");
  const fType = document.getElementById("fType");
  const fStatus = document.getElementById("fStatus");
  let items = [];

  fType.innerHTML = `<option value="">All types</option>` + optionsHtml(ITEM_TYPES);
  fStatus.innerHTML = `<option value="">All statuses</option>` + optionsHtml(ITEM_STATUSES);
  fType.onchange = fStatus.onchange = load;
  document.getElementById("reload").onclick = load;

  async function load() {
    body.innerHTML = `<tr><td colspan="8">${stateHtml.loading()}</td></tr>`;
    try {
      const t = fType.value, s = fStatus.value;
      let list;
      if (t && s) {
        const [a, b] = await Promise.all([api("/api/lost-found/type/" + t), api("/api/lost-found/status/" + s)]);
        const ids = new Set((b || []).map((x) => x.id));
        list = (a || []).filter((x) => ids.has(x.id));
      } else if (t) list = await api("/api/lost-found/type/" + t);
      else if (s) list = await api("/api/lost-found/status/" + s);
      else list = await api("/api/lost-found");
      items = (list || []).sort((a, b) => b.id - a.id);
      render();
    } catch (e) {
      body.innerHTML = `<tr><td colspan="8">${stateHtml.error(e.message)}</td></tr>`;
      countEl.textContent = "";
    }
  }

  function render() {
    countEl.textContent = items.length + (items.length === 1 ? " report" : " reports");
    if (!items.length) { body.innerHTML = `<tr><td colspan="8">${stateHtml.empty("No reports match the selected filters.", "fa-filter-circle-xmark")}</td></tr>`; return; }
    body.innerHTML = items.map((i) => `<tr data-id="${esc(i.id)}">
      <td>#${esc(i.id)}</td>
      <td><b>${esc(i.itemName)}</b><div class="muted">${esc(i.description)}</div></td>
      <td>${badge(i.type)}</td>
      <td>${esc(i.categoryName)}</td>
      <td>${esc(i.location)}</td>
      <td>${esc(i.userName)}</td>
      <td>${fmtDate(i.createdAt)}</td>
      <td><select aria-label="Status">${optionsHtml(ITEM_STATUSES, i.status)}</select></td></tr>`).join("");
  }

  body.addEventListener("change", async (e) => {
    const sel = e.target.closest("select");
    if (!sel) return;
    const id = sel.closest("tr").dataset.id;
    try {
      await api(`/api/lost-found/${id}/status?status=${encodeURIComponent(sel.value)}`, { method: "PATCH" });
      toast(`Item #${id} marked ${sel.value.replace(/_/g, " ")}.`);
    } catch (err) { toast(err.message, "error"); }
    load();
  });

  load();
});
