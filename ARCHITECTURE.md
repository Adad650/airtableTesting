# Architecture Overview

This project is a simple Airtable CRUD app with a static frontend hosted on GitHub Pages and a backend proxy hosted on Render.com. The proxy keeps the Airtable token off the client while providing a single `/api/records` endpoint for create, read, update, and delete.

The stack includes:
- Frontend: `index.html` (HTML/CSS/JS, runs in the browser)
- Backend: `server.js` (Node.js HTTP server on Render.com)
- Data store: Airtable REST API
- Infra: Render.com (backend), GitHub Pages (frontend)

There is a legacy Python file `app.py` listed in `.gitignore` and not used in the running system.

## System Components and Responsibilities

### Frontend (GitHub Pages)
Primary file: `index.html`

Responsibilities:
- Renders the UI (config bar, toolbar, table, status messages).
- Holds local UI state (`records` array).
- Sends HTTP requests to the backend proxy.
- Renders Airtable records into table rows.

Key functions and their responsibilities:
- `connect()`: validates the backend URL and triggers a first fetch.
- `fetchRecords()`: GETs records from the backend and updates `records`.
- `render()`: draws table rows for `records`.
- `addRow()`: POSTs a new empty record.
- `updateField(input)`: PATCHes a single field when an input changes.
- `deleteRow(id)`: DELETEs a record by id.
- `apiUrl()` and `getConfig()`: build the backend URL from the input.
- `setStatus(msg, type)`: UI feedback (success/error/info).

### Backend Proxy (Render.com)
Primary file: `server.js`

Responsibilities:
- Enforces CORS for browser clients.
- Accepts frontend requests at `/api/records`.
- Proxies requests to Airtable with the server-side token.
- Returns Airtable responses unchanged to the client.

Key functions and their responsibilities:
- `corsHeaders(origin)`: builds CORS headers (GitHub Pages + localhost).
- `handle(req, res)`: main request handler for `/api/records`.

### Data Store (Airtable)
Primary API endpoint: `https://api.airtable.com/v0/{BASE_ID}/{TABLE_NAME}`

Responsibilities:
- Stores records and fields.
- Validates input and returns Airtable-specific errors.
- Supports CRUD via REST API.

## Data Flow (Graph)

```mermaid
flowchart LR
  UI[Browser UI\nindex.html] -->|GET /api/records| API[Render Proxy\nserver.js]
  UI -->|POST /api/records| API
  UI -->|PATCH /api/records| API
  UI -->|DELETE /api/records?records[]=id| API

  API -->|HTTPS + Bearer Token| AT[Airtable API\n/v0/{base}/{table}]
  AT -->|JSON records| API -->|JSON records| UI
```

## End-to-End Request Flow

1. User opens GitHub Pages URL (static `index.html`).
2. User enters Render backend URL and clicks **Connect**.
3. Browser calls `GET {apiBase}/api/records`.
4. Render proxy validates path and forwards to Airtable:
   - `GET https://api.airtable.com/v0/{base}/{table}`
5. Airtable returns JSON; proxy forwards the response to the browser.
6. Frontend updates `records` and re-renders the table.

This same pattern is used for all CRUD actions; only the HTTP method and payload differ.

## HTTP Workflow Mapping (Frontend → Backend → Airtable)

### Read: `fetchRecords()`
- Browser: `GET /api/records`
- Backend: `GET https://api.airtable.com/v0/{base}/{table}`
- Response: `{ records: [...] }` stored in `records` then rendered.

### Create: `addRow()`
- Browser: `POST /api/records`
- Body:
  - `{ "records": [ { "fields": {} } ] }`
- Backend: `POST https://api.airtable.com/v0/{base}/{table}`
- Response: created record, then frontend calls `fetchRecords()` to refresh.

### Update: `updateField(input)`
- Browser: `PATCH /api/records`
- Body:
  - `{ "records": [ { "id": "<recordId>", "fields": { "<field>": <value> } } ] }`
- Backend: `PATCH https://api.airtable.com/v0/{base}/{table}`
- Response: updated record, then frontend calls `fetchRecords()` to refresh.

### Delete: `deleteRow(id)`
- Browser: `DELETE /api/records?records[]=<id>`
- Backend: `DELETE https://api.airtable.com/v0/{base}/{table}?records[]=<id>`
- Response: deletion result, then frontend calls `fetchRecords()` to refresh.

## How Functions Map to HTTP Calls

### Frontend Functions

- `connect()` → triggers `fetchRecords()` (GET)
- `fetchRecords()` → `GET /api/records`
- `addRow()` → `POST /api/records`
- `updateField(input)` → `PATCH /api/records`
- `deleteRow(id)` → `DELETE /api/records?records[]=id`

### Backend Functions

- `handle(req, res)` → routes methods for `/api/records`:
  - `GET` → Airtable list records
  - `POST` → Airtable create record
  - `PATCH` → Airtable update record
  - `DELETE` → Airtable delete record(s)
  - `OPTIONS` → CORS preflight response
- `corsHeaders(origin)` → adds CORS headers to every response.

## Infra and Config

- Render.com:
  - Runs `node server.js`
  - Requires `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`, `AIRTABLE_TABLE_NAME`
  - Exposes HTTPS endpoint used by the frontend
- GitHub Pages:
  - Serves `index.html`
  - No secrets stored in the frontend

## Summary

This architecture is a simple secure proxy pattern:
- The frontend is static and untrusted; it never sees the Airtable token.
- The backend is minimal and stateless; it forwards requests to Airtable.
- Data moves in one direction through the proxy, and responses flow back unchanged.
