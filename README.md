# GPMS Web App

Frontend for GPMS (Garment Production Management System), built with Next.js App Router, React Query, MUI, Tailwind, and Zustand.

## Deployment

- Live frontend: `https://gpms-web664.vercel.app`
- Production API base URL: `https://clever-serenity-production.up.railway.app/api`
- Swagger docs: `https://clever-serenity-production.up.railway.app/api/docs`

## What This App Does

This app is the factory operations UI for:

- Buyers
- Styles and BOM
- Materials
- Purchase Orders
- Inventory
- Production planning
- Cutting
- Sewing
- Quality Control
- Dashboard monitoring

It connects to the GPMS API and sends the selected factory in the `x-factory-id` header automatically.

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- @tanstack/react-query
- MUI + custom UI wrappers
- Tailwind CSS
- Zustand (persisted UI/session context)
- Axios
- Recharts

## Local Setup

### Prerequisites

- Node.js 20+ recommended
- pnpm 10+
- Running GPMS API (local or hosted)

### Install

From monorepo root:

```bash
pnpm install
```

### Environment

Create or edit `apps/web/.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

Default in this repo may point to hosted API.

## Run

From `apps/web`:

```bash
pnpm dev
```

Or from monorepo root:

```bash
pnpm --filter web dev
```

## Scripts

In `apps/web/package.json`:

- `pnpm dev` - start dev server
- `pnpm build` - production build
- `pnpm start` - serve built app
- `pnpm lint` - ESLint CLI (non-interactive)

## Auth and Session Model

- Cookie-based auth via API:
  - `POST /auth/login`
  - `GET /auth/me`
  - `POST /auth/logout`
- `ProtectedPage` redirects anonymous users to `/login?next=...`.
- Login form currently defaults to:
  - email: `admin@gpms.com`
  - password: `admin123`

## Global App Context

Managed in Zustand store (`lib/store.ts`):

- `factoryId`
- `selectedDate` (defaults to local today)
- `theme`
- `globalSearch`
- command palette/open action intent state

`selectedDate` is intentionally not persisted across reloads (fresh local today each load).

## Route Overview

All routes below are inside authenticated `(protected)` layout:

- `/dashboard`
  - Live KPIs, plan-vs-actual, hourly output, defect chart, line monitor
  - Quick output entry
  - CTA buttons route to `/pos`, `/sewing`, `/qc`
- `/buyers`
  - Create/update/delete buyers
- `/styles`
  - Create/update/delete styles
  - Multi-line BOM editor (add/remove lines, save full BOM in one request)
- `/materials`
  - Material master creation and listing
- `/pos`
  - Create PO, add PO items, confirm PO
  - Status actions: `Ship` and `Close` (via `/pos/:id/status`)
  - Material requirement + stock coverage view
- `/inventory`
  - Receive stock
  - Issue to cutting
  - Stock ledger
- `/plans`
  - Create production plan
  - Assign PO item to line with daily target
- `/cutting`
  - Create cutting batch
  - Generate bundles
- `/sewing`
  - Submit hourly output (date is global selected date)
  - Live line status + WIP
- `/qc`
  - Submit inspections
  - QC summary by selected date

## UX Features

- Global topbar:
  - factory switcher
  - shared date picker
  - global search
- Command palette (`Cmd/Ctrl + K`)
- Drawer-based detail panels
- Optimistic updates in dashboard output posting

## API Integration Notes

- `lib/api.ts` sets `withCredentials: true`.
- Injects `x-factory-id` from store on every request if selected.
- Includes payload normalization for `/plans/:id/assign`.

## Linting Status

ESLint is configured and runs non-interactively.

- Current state: warnings exist (mostly `any` typing and some hook warnings), but no lint errors.
- You can harden later by enforcing `--max-warnings=0` after cleanup.

## Build/Runtime Notes

- `next build` succeeds.
- Next.js may warn about inferred workspace root because multiple lockfiles exist on the machine path; this does not block build.

## Key Files

- `app/` - routes and pages
- `components/` - shell, drawers, reusable UI
- `lib/api.ts` - HTTP client + headers
- `lib/auth.tsx` - auth hydration and logout/login state
- `lib/store.ts` - app-wide UI/session context
- `eslint.config.mjs` - ESLint flat config
