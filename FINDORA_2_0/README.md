# UniAssist — Student Portal

A responsive Vite + TypeScript student portal for the UniAssist Spring Boot API. It combines maintenance ticket creation/tracking with campus Lost & Found reporting and browsing.

## Run
1. Start MySQL and the Spring Boot backend as described in the repository-root [README](../README.md).
2. From this folder, run `npm install` once, then `npm run dev`.
3. Open the Vite URL (usually http://localhost:5173).

## Features
- Student registration and login through the shared backend API
- Dashboard with live ticket counts, ticket activity, and Lost & Found summary
- Create and track maintenance tickets
- Browse Lost & Found reports from the shared backend with search and filters
- Report lost or found items; submitted reports are visible to other users
- Item details and resolve-lost-report actions
- My Claims and Activity pages
- Responsive desktop and mobile layouts

## Backend connection

The app calls `http://localhost:8080`. Change `API_BASE_URL` in `src/app.ts` if your backend runs elsewhere. The backend CORS config allows Vite's `localhost:5173` / `127.0.0.1:5173` origins and the admin portal's port 5500.

## Current backend limitations

- The backend has no claim-review endpoint. A claim request updates the item's shared status, but the claimant's details and My Claims history are stored only in this browser.
- The backend has no image-upload endpoint. Reports can include an optional public image URL, not a local photo upload.
- The backend currently does not enforce authentication or role authorization on API requests. The portal's session checks are not a security boundary; server-side authorization is required before production use.
- Staff accounts should use the separate `admin-portal/` and must already exist with the appropriate role.

The sidebar logo is `public/assets/main-logo.jpg`; replace it to change the university logo while keeping the filename.
