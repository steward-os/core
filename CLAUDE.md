# Fanfare Tools (core) — Claude Specification

## Project Overview

Open-source standalone member management app for orchestras. Single-tenant: one PocketBase instance + one React frontend.

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS
- **Backend**: PocketBase (SQLite)
- **UI**: Headless UI, Heroicons
- **Utils**: DayJS, React Router DOM, @dnd-kit

## Development Commands

```bash
# Backend
cd pocketbase && ./pocketbase serve --dir=./pb_data

# Frontend
cd frontend && nvm use && npm install && npm run dev   # http://localhost:5173

# Tests & checks
cd frontend && npm run test:run   # unit tests
cd frontend && npm run test:e2e   # E2E (requires nvm use 20)
cd frontend && npm run lint
cd frontend && npm run build
```

## Environment Variables (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_POCKETBASE_URL` | Yes | PocketBase URL (default: `http://localhost:8090`) |
| `VITE_VAPID_PUBLIC_KEY` | No | Web Push public key |
| `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` | No | PostHog analytics |

## Key Conventions

- Functional components with hooks only
- PocketBase SDK for all API calls: `pb.collection('name').getFullList()`
- **Tables**: flex layouts for interactive tables, HTML tables for simple display only
- **Forms**: use `FormField` / `FormFieldSelect` components
- **DateTime**: convert ISO ↔ `datetime-local` format (see `docs/form-components.md`)
- **Services**: pure PocketBase operations only — no React state in service files

### PocketBase API Patterns

```javascript
pb.authStore.isValid                    // auth check
pb.collection('name').getFullList()     // fetch all
pb.collection('name').create(data)      // create
pb.collection('name').update(id, data)  // update
```

### Service Naming

- `<resource>Service.js` — e.g. `sessionService.js`, `attendanceService.js`
- Services handle data operations; hooks handle state management

## Authentication

- PocketBase `pb.authStore` for all auth
- Admin roles: `leden_app_session_admin`, `leden_app_volunteer_admin`, `leden_app_banner_admin`

## Optional Features

- **AI text improvement**: calls `/ai/improve` on PocketBase host — not standard PocketBase; button shows error if absent
- **Push notifications**: requires VAPID key pair + external `POST /send-push` service + `PUSH_SERVICE_URL` env var

## Additional Documentation

- `docs/table-layouts.md` — flex vs HTML tables
- `docs/form-components.md` — FormField, FormFieldSelect, DateTime handling
- `docs/drag-and-drop.md` — sortable lists
- `docs/component-refactoring-patterns.md` — custom hooks and component extraction
- `docs/hook-utilities.md` — reusable hooks (pagination, filtering, sorting)
- `docs/financial-overview.md` — balance sheet & P&L, virtual rows pattern
- `docs/encryption.md` — client-side AES-GCM for sensitive fields (IBAN, notes)
- `POLYMORPHIC_REMARKS_USAGE.md` — polymorphic remarks pattern

## Relation to `manager`

`core` is the reference implementation. Features developed here should be considered for porting to `manager/frontend` and `manager/backend/pocketbase`. See the parent `CLAUDE.md` for the full relationship.
