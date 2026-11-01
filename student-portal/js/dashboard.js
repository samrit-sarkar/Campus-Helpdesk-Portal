// Dashboard: ticket counts + recent activity from GET /api/tickets/user/{id}
document.addEventListener("DOMContentLoaded", async () => {
  const user = getUser();
  if (!user) return;
  document.getElementById("welcome").textContent = "Welcome back, " + user.name + " 👋";
  const stats = document.getElementById("stats"), recent = document.getElementById("recent");
  recent.innerHTML = stateHtml.loading();
  try {
    const tickets = (await api("/api/tickets/user/" + encodeURIComponent(user.id))) || [];
    const count = (s) => tickets.filter((t) => t.status === s).length;
    const cards = [["Total tickets", tickets.length, "fa-ticket"], ["Pending", count("PENDING"), "fa-clock"],
      ["Assigned", count("ASSIGNED"), "fa-user-check"], ["In progress", count("IN_PROGRESS"), "fa-spinner"], ["Resolved", count("RESOLVED"), "fa-circle-check"]];
    stats.innerHTML = cards.map(([l, n, i]) => `<div class="card stat"><div class="ico"><i class="fa-solid ${i}"></i></div><div><b>${n}</b><span>${l}</span></div></div>`).join("");
    const latest = [...tickets].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 5);
    recent.innerHTML = latest.length ? `<ul class="activity">` + latest.map((t) =>
      `<li><div><b>#${esc(t.id)} · ${esc(pick(t.category, "name", "categoryName") || "Ticket")}</b><small>Room ${esc(t.roomNumber)} · ${fmtDate(pick(t, "createdAt", "createdDate"))}</small></div>${badge(t.status)}</li>`).join("") + `</ul>`
      : stateHtml.empty("No tickets yet. Create your first one!", "fa-ticket");
  } catch (e) { stats.innerHTML = ""; recent.innerHTML = stateHtml.error(e.message); }
});
