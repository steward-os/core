# Fanfare Tools

Open-source member management application for orchestras. Built with React 19 + Vite on the frontend and [PocketBase](https://pocketbase.io) as the backend.

## Features

- Member administration and group management
- Session scheduling and attendance tracking
- Volunteering job management
- Board meeting minutes with action tracking
- Mailing management
- Financial overview (balance sheet / P&L)
- Contact form with email notifications
- Push notifications (requires optional push service — see below)

## Prerequisites

- Node.js 18+ (see `frontend/.nvmrc`)
- [PocketBase](https://pocketbase.io/docs/) binary (v0.34+)

## Setup

### 1. PocketBase

Download the PocketBase binary for your platform from [pocketbase.io](https://pocketbase.io/docs/) and place it at `pocketbase/pocketbase`.

```bash
chmod +x pocketbase/pocketbase

./pocketbase/pocketbase serve \
  --dir=./pocketbase/pb_data \
  --migrationsDir=./pocketbase/pb_migrations \
  --hooksDir=./pocketbase/pb_hooks
```

On first run, PocketBase will apply all migrations automatically and prompt you to create an admin account at `http://localhost:8090/_/`.

### 2. Frontend

```bash
cd frontend
cp env.example .env        # then edit VITE_POCKETBASE_URL if needed
npm install
npm run dev
```

The app is now available at `http://localhost:5173`.

## Environment Variables

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_POCKETBASE_URL` | Yes | PocketBase base URL (default: `http://localhost:8090`) |
| `VITE_VAPID_PUBLIC_KEY` | No | Web Push VAPID public key (enables push notifications) |
| `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` | No | PostHog analytics token |
| `VITE_PUBLIC_POSTHOG_HOST` | No | PostHog host (default: `https://eu.i.posthog.com`) |

### PocketBase hooks (environment variables for the PocketBase process)

| Variable | Required | Description |
|---|---|---|
| `PUSH_SERVICE_URL` | No | URL of a WebPush sending service. If unset, push delivery is silently skipped. |
| `CONTACT_EMAIL_<hostname>` | No | Override contact form recipient per hostname (dots → underscores), e.g. `CONTACT_EMAIL_mysite_nl=info@mysite.nl`. Falls back to the address configured in PocketBase → Settings → Mail. |

## Optional Features

### AI text improvement

Meeting minutes include an "improve text" button that calls `/ai/improve` on the PocketBase host. This endpoint is not part of standard PocketBase. Without it, the button will show an error; all other meeting minute functionality still works.

### Push notifications

Push notification *subscriptions* are always stored in PocketBase. Actual *delivery* requires:
1. A VAPID key pair (`VITE_VAPID_PUBLIC_KEY` + the private key on the sending service)
2. A small HTTP service that accepts `POST /send-push` and delivers via the Web Push protocol
3. Setting `PUSH_SERVICE_URL` in the PocketBase process environment

## Development

```bash
# Unit tests
cd frontend && npm run test:run

# E2E tests (requires nvm use 20)
cd frontend && npm run test:e2e

# Lint
cd frontend && npm run lint

# Production build
cd frontend && npm run build
```

## License

[MIT](LICENSE)
