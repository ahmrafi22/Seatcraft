# SeatCraft web

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Motion · react-icons

The operator console and candidate portal for the SeatCraft API. Every screen is
server-rendered; the browser never holds the JWT.

## Run it

```bash
# 1. API (separate terminal)
cd ../backend
dotnet run --project src/SeatCraft.Api        # http://localhost:5199

# 2. web
cd ../frontend
npm install
npm run dev                                    # http://localhost:3000
```

Point it at a different API host with `SEATCRAFT_API_ORIGIN`:

```bash
SEATCRAFT_API_ORIGIN=https://seatcraft-api.example.com npm run dev
```

## Demo data

Sign in as `admin@demo.test` / `Passw0rd!123`, or press **Sign in to the demo tenant**
on `/login` (rendered in development only).

If the database is empty, use **Seed demo exam** on `/exams` — it creates an exam, the
colleges, the halls and every candidate in one call. Development environment only.

Then: `/exams` → open the seeded exam → **Run allocation** → **Open seat planner**.

Public lookup: `/lookup`, code `demo`, roll `R00001`, date of birth `2000-01-01`.

## Pages

| Route | What it does |
|---|---|
| `/` | Dashboard — stats, current exam, run history, institution spread, rules |
| `/exams` | Exam list, create form, demo seed |
| `/exams/[id]` | Allocation runner with live progress, halls, rules, candidates |
| `/exams/[id]/plan` | Hall visualiser: drag to swap, drag to an empty seat to move, publish, documents |
| `/lookup` | Candidate portal — anonymous, rate-limited, roll + date of birth |
| `/login` | Sign in (writes the httpOnly cookie) |

## Structure

```
src/
  app/
    layout.tsx                  fonts, sidebar, mobile nav
    page.tsx                    dashboard
    exams/page.tsx              exam list, create, seed
    exams/[examId]/page.tsx     allocation, halls, candidates, rules
    exams/[examId]/plan/        hall visualiser + publish
    lookup/page.tsx             candidate portal
    login/page.tsx              sign in
    actions/                    server actions (the BFF boundary)
    api/runs/…                  polling route for the progress bar
  components/
    shell/                      sidebar, topbar, mobile nav
    ui/                         pane, button, badge, stat, field, switch, alert
    planner/                    hall board, planner shell, document downloads
    exams/                      allocation panel, constraint editor, forms
    hero/                       animated hall preview
  lib/
    api/                        typed client, error mapping, DTOs
    session.ts                  base64url session in an httpOnly cookie
    auth-guard.ts               requireSession / requireAdmin
    colors.ts                   deterministic institution hues
```

## How the auth boundary works

1. `POST /api/auth/login` runs in a server action and writes the whole `AuthResponse`
   into an httpOnly cookie (`seatcraft_session`), base64url-encoded so no cookie-hostile
   characters survive.
2. `lib/api/client.ts` reads that cookie with `next/headers` and attaches the bearer
   token on the way out.
3. Client components never call the API directly. They call server actions, or the one
   `/api/runs/...` route handler that exists so the progress bar can poll.
4. Every action calls `requireSession()` or `requireAdmin()` first — Server Functions are
   reachable by direct POST, so the UI is never the authorisation boundary.

That means no CORS config, no token in `localStorage`, and no `NEXT_PUBLIC_` secret.

## Design

"Solid glass, colour forward" — thick smoky panes with a lit inner rim sitting on a
dark aurora, after [solid-glass](https://deeplethe.github.io/solid-glass/), pushed much
harder on colour:

- Six institution hues (violet, cyan, emerald, amber, rose, indigo) assigned by a hash
  of the institution id, so a college keeps its colour across every page.
- Every stat tile blooms in its own accent; every seat is tinted by its institution.
- Motion is limited to mount fades, the aurora drift, a `layoutId` nav rail and seat
  drag feedback. `prefers-reduced-motion` disables all of it.
- Tokens are OKLCH, defined once in `globals.css` under `@theme`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | dev server on :3000 |
| `npm run build` | production build |
| `npm run start` | serve the build |
| `npm run lint` | eslint |
| `npm run typecheck` | `tsc --noEmit` |

`scripts/*.cjs` are throwaway verification harnesses that drive headless Chrome over the
DevTools protocol. They expect a dev server on :3100 and a session cookie in
`%TEMP%/sc_cookie.txt`. Not part of the app.

## Verified against the live API

| Flow | Result |
|---|---|
| Sign in → dashboard | 500 candidates, 12 halls, 0 blocking violations |
| Start run → poll → complete | Strict, seed 7, 8 ms, 0 violations |
| Drag two seats | `R00004` and `R00005` exchanged, plan revalidated |
| Drag to an empty seat | moved to `R10-C7` via `POST /move` |
| Publish plan | status flips to Published, documents unlock |
| Admit cards | 40-entry zip, 2.7 MB, `PK\x03\x04` |
| Attendance sheets | 1-entry zip, 53 KB |
| Public lookup | `R00001` / `2000-01-01` → Hall 01, R1-C2 |

## Known gaps

- No exam delete/archive button in the UI; both are Admin-only endpoints.
- Institution CRUD is read-only in the UI.
- Candidate import (CSV) is not wired — the API supports it.
- Seat selection uses a drag or click, but there is no keyboard move path yet.
