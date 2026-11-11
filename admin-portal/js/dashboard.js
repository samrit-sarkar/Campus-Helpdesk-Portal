initPage(async (user) => {
  document.getElementById("welcome").textContent = "Welcome, " + user.name;
  const stats = document.getElementById("stats");
  const recent = document.getElementById("recent");
  stats.innerHTML = stateHtml.loading();
  try {
    const [tickets, items] = await Promise.all([api("/api/tickets"), api("/api/lost-found")]);
    const t = tickets || [];
    const n = (s) => t.filter((x) => x.status === s).length;
    const cards = [
      ["", "fa-ticket", t.length, "Total tickets"],
      ["s-pending", "fa-hourglass-half", n("PENDING"), "Pending"],
      ["s-progress", "fa-gears", n("IN_PROGRESS"), "In progress"],
      ["s-resolved", "fa-circle-check", n("RESOLVED"), "Resolved"]
    ];
    stats.innerHTML = cards.map(([cls, ic, v, l]) =>
      `<div class="card stat ${cls}"><div class="ico"><i class="fa-solid ${ic}"></i></div><div><b>${v}</b><span>${l}</span></div></div>`).join("");

    const sorted = [...t].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    recent.innerHTML = sorted.length ? `<table><thead><tr><th>ID</th><th>Student</th><th>Category</th><th>Title</th><th>Priority</th><th>Status</th><th>Created</th></tr></thead><tbody>` +
      sorted.map((x) => `<tr><td>#${esc(x.id)}</td><td>${esc(x.userName)}</td><td>${esc(x.categoryName)}</td><td>${esc(x.title || "—")}</td><td>${badge(x.priority)}</td><td>${badge(x.status)}</td><td>${fmtDate(x.createdAt)}</td></tr>`).join("") +
      `</tbody></table>` : stateHtml.empty("No tickets yet.");

    const open = (items || []).filter((i) => i.status !== "RESOLVED").length;
    document.getElementById("lfSummary").innerHTML =
      `<b>${(items || []).length}</b> reports in total &middot; <b>${open}</b> not yet resolved`;
  } catch (e) {
    stats.innerHTML = "";
    recent.innerHTML = stateHtml.error(e.message);
  }
});
