initPage(() => {
  const body = document.getElementById("rows");
  let cats = [];

  async function load() {
    body.innerHTML = `<tr><td colspan="4">${stateHtml.loading()}</td></tr>`;
    try {
      cats = await api("/api/categories") || [];
      if (!cats.length) { body.innerHTML = `<tr><td colspan="4">${stateHtml.empty("No categories yet. Create the first one.", "fa-tags")}</td></tr>`; return; }
      body.innerHTML = cats.map((c) => `<tr data-id="${esc(c.id)}">
        <td>#${esc(c.id)}</td><td><b>${esc(c.name)}</b></td>
        <td class="desc">${c.description ? esc(c.description) : '<span class="muted">—</span>'}</td>
        <td><div class="actions">
          <button class="btn btn-outline btn-sm" data-act="edit"><i class="fa-solid fa-pen"></i> Edit</button>
          <button class="btn btn-danger btn-sm" data-act="delete"><i class="fa-solid fa-trash"></i> Delete</button></div></td></tr>`).join("");
    } catch (e) {
      body.innerHTML = `<tr><td colspan="4">${stateHtml.error(e.message)}</td></tr>`;
    }
  }

  function form(cat) {
    const editing = !!cat;
    openModal(editing ? "Edit category" : "New category",
      `<div class="field"><label>Name</label><input type="text" name="name" maxlength="255" value="${esc(cat?.name)}"></div>
       <div class="field"><label>Description</label><textarea name="description" rows="3" maxlength="500">${esc(cat?.description)}</textarea></div>`,
      editing ? "Save changes" : "Create", async (f, close) => {
        const name = f.name.value.trim();
        if (!name) throw new Error("Category name is required.");
        const payload = JSON.stringify({ name, description: f.description.value.trim() });
        if (editing) await api("/api/categories/" + cat.id, { method: "PUT", body: payload });
        else await api("/api/categories", { method: "POST", body: payload });
        close();
        toast(editing ? "Category updated." : "Category created.");
        load();
      });
  }

  document.getElementById("add").onclick = () => form(null);

  body.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-act]");
    if (!btn) return;
    const id = btn.closest("tr").dataset.id;
    const cat = cats.find((c) => String(c.id) === id);
    if (btn.dataset.act === "edit") return form(cat);
    if (!confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    try {
      await api("/api/categories/" + id, { method: "DELETE" });
      toast("Category deleted.");
    } catch (err) {
      // e.g. 400 "Cannot delete category because it is in use."
      toast(err.message, "error");
    }
    load();
  });

  load();
});
