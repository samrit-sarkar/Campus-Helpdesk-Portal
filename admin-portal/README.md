# UniAssist – Staff/Admin Portal

Plain HTML/CSS/JS, no build step. This portal is part of the repository and uses the same Spring Boot API as `student-portal/`.

## Setup
1. Follow the repository-root [README](../README.md) to start MySQL and the backend.
2. Serve the repository root on port **5500** with VS Code Live Server, then open `admin-portal/login.html` (or choose the staff/admin portal from the root `index.html`).
3. Log in with an existing user whose role is `STAFF` or `ADMIN`.

## Pages
| Page | What it does |
|---|---|
| login.html | Staff/admin login (rejects STUDENT accounts) |
| pages/dashboard.html | Total / pending / in-progress / resolved counts (from GET /api/tickets), recent tickets, Lost & Found summary |
| pages/tickets.html | Table + status/category filters, change status & priority, assign staff |
| pages/categories.html | List, create, edit, delete (in-use delete shows the server's message) |
| pages/lost-found.html | Table + type/status filters, status update |

## Known gaps
- **No staff-list endpoint.** Assigning needs a staff user ID, so the modal has an ID box.
- **No server-side authorization.** Every endpoint is open; the role check here is only cosmetic.
- Public registration always creates a student account. Staff accounts must be provisioned by an administrator.
- Valid values: status `PENDING, ASSIGNED, IN_PROGRESS, RESOLVED`; priority `LOW, MEDIUM, HIGH`; item status `OPEN, CLAIM_REQUESTED, VERIFIED, RESOLVED`.
