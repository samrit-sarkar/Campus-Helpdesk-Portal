
document.addEventListener("DOMContentLoaded", () => {

  const user = getUser();

  if (!user || user.id == null) return;

  // ==============================
  // CREATE TICKET
  // ==============================

  const form = document.getElementById("ticketForm");

  if (form) {

    const categoryInput =
      form.elements.namedItem("category");

    const roomInput =
      form.elements.namedItem("roomNumber");

    const descriptionInput =
      form.elements.namedItem("description");

    const titleInput =
      form.elements.namedItem("title");

    // Load categories automatically
    loadCategories(categoryInput);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!titleInput || !categoryInput ||
          !roomInput || !descriptionInput) {
        toast("Some ticket form fields are missing.", "error");
        return;
      }

      const ok = [
        validateField(
          titleInput,
          titleInput.value.trim().length >= 3,
          "Enter a ticket title (min 3 characters)"
        ),

        validateField(
          categoryInput,
          !!categoryInput.value,
          "Select a category"
        ),

        validateField(
          roomInput,
          roomInput.value.trim().length > 0,
          "Room number is required"
        ),

        validateField(
          descriptionInput,
          descriptionInput.value.trim().length >= 10,
          "Description must contain at least 10 characters"
        )

      ].every(Boolean);

      if (!ok) return;

      const btn =
        form.querySelector('button[type="submit"]');

      setLoading(btn, true, "Submitting…");

      try {

        const ticketData = {
          title: titleInput.value.trim(),
          description: descriptionInput.value.trim(),
          roomNo: roomInput.value.trim(),
          priority: "MEDIUM",
          user: {
            id: Number(user.id)
          },
          category: {
            id: Number(categoryInput.value)
          }
        };

        console.log("Submitting ticket:", ticketData);

        const result = await api("/api/tickets", {
          method: "POST",
          body: JSON.stringify(ticketData)
        });

        console.log("Ticket created:", result);

        toast("Ticket submitted successfully!");

        form.reset();

      } catch (error) {
        console.error("Ticket creation failed:", error);
        toast(error.message, "error");
      } finally {
        setLoading(btn, false);
      }
    });
  }

  // ==============================
  // MY TICKETS
  // ==============================

  const holder =
    document.getElementById("ticketsTable");

  if (holder) {

    let all = [];
    let filter = "ALL";

    const chips =
      document.getElementById("chips");

    const statuses = [
      "ALL",
      "OPEN",
      "PENDING",
      "ASSIGNED",
      "IN_PROGRESS",
      "RESOLVED"
    ];

    if (chips) {
      chips.innerHTML = "";

      statuses.forEach((status) => {

        const button = document.createElement("button");

        button.className =
          "chip" + (status === "ALL" ? " active" : "");

        button.textContent = status.replace(/_/g, " ");

        button.onclick = () => {

          filter = status;

          chips.querySelectorAll(".chip").forEach((c) =>
            c.classList.toggle("active", c === button)
          );

          draw();
        };

        chips.appendChild(button);
      });
    }

    function draw() {

      const rows = all.filter((ticket) =>
        filter === "ALL" || ticket.status === filter
      );

      if (!rows.length) {

        holder.innerHTML = stateHtml.empty(
          all.length
            ? "No tickets with this status."
            : "You haven't submitted any tickets yet.",
          "fa-ticket"
        );

        return;
      }

      holder.innerHTML = `
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Room</th>
                <th>Description</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>

            <tbody>
              ${rows.map((ticket) => `
                <tr>
                  <td>#${esc(ticket.id)}</td>

                  <td>${esc(
                    ticket.categoryName ||
                    ticket.category?.name ||
                    "—"
                  )}</td>

                  <td>${esc(ticket.roomNo || "—")}</td>

                  <td>${esc(ticket.description)}</td>

                  <td>${badge(ticket.priority)}</td>

                  <td>${badge(ticket.status)}</td>

                  <td>${fmtDate(
                    pick(ticket, "createdAt", "createdDate")
                  )}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      `;
    }

    holder.innerHTML =
      stateHtml.loading("Loading your tickets…");

    api("/api/tickets/user/" + encodeURIComponent(user.id))
      .then((data) => {

        all = Array.isArray(data) ? data : [];

        all.sort((a, b) =>
          (b.id || 0) - (a.id || 0)
        );

        draw();

      })
      .catch((error) => {

        console.error("Failed to load tickets:", error);

        holder.innerHTML =
          stateHtml.error(error.message);
      });
  }
});
