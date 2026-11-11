# Campus Helpdesk Portal

UniAssist is one helpdesk application with a Spring Boot/MySQL API and two portals:

- **Student portal:** [FINDORA_2_0](./FINDORA_2_0/) provides registration, maintenance tickets, and Lost & Found.
- **Staff/admin portal:** `admin-portal/` provides ticket triage, categories, and Lost & Found management.

Both portals call the same backend at `http://localhost:8080`.

## Requirements

- Java 25
- MySQL
- A static web server such as the VS Code Live Server extension

## Run locally

1. Create a MySQL database named `UniAssist`.
2. Set the database URL, username, and password in `src/main/resources/application.properties` to match your local MySQL setup.
3. Start the API from the repository root:

   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

   The API listens on port `8080`. Hibernate updates the schema on startup.
4. Start the student portal from `FINDORA_2_0`:

   ```powershell
   cd FINDORA_2_0
   npm install
   npm run dev
   ```

   Open the Vite URL (usually `http://localhost:5173`).
5. To use the staff/admin portal, serve the repository root with Live Server on port `5500` and open `admin-portal/login.html`.

The backend CORS configuration permits the Vite student portal on port `5173` and the staff/admin portal on port `5500`. If you change either web-server port, update `src/main/java/com/uniassist/config/CorsConfig.java` as well.

## Main API routes

| Area | Routes |
|---|---|
| Authentication | `POST /api/auth/register`, `POST /api/auth/login` |
| Categories | `GET /api/categories`, `POST /api/categories`, `PUT /api/categories/{id}`, `DELETE /api/categories/{id}` |
| Tickets | `GET /api/tickets`, `GET /api/tickets/user/{userId}`, `POST /api/tickets`, `PATCH /api/tickets/{id}/status`, `PATCH /api/tickets/{id}/priority`, `PATCH /api/tickets/{id}/assign` |
| Lost & Found | `GET /api/lost-found`, `POST /api/lost-found`, `PATCH /api/lost-found/{id}/status` |

The two portals share these API routes and the backend response DTOs. New ticket titles are persisted and returned as part of the ticket response. The older `student-portal/` static prototype is not the active student experience; use `FINDORA_2_0/`.

## Notes

- Student registration creates student accounts. Staff/admin accounts must already exist in the database with the corresponding role.
- Public registration always creates a `STUDENT`; it cannot be used to self-assign staff privileges.
- The current backend does not enforce staff authorization on management endpoints; the staff portal's role check is only a client-side navigation guard.
- Assignment currently accepts a staff user ID because the backend does not expose a staff-list endpoint.
- Claims are not fully server-backed: claim details and history stay in the browser, and the backend has no image-upload endpoint.
- Run backend tests with `.\mvnw.cmd test`.
