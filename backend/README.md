# SeatCraft — Backend

Exam seat allocation and admit-card engine. Multi-tenant ASP.NET Core API that assigns
thousands of candidates to seats under real examination constraints, then issues admit
cards and attendance sheets.

The interesting part is the **solver**: seat allocation is graph colouring on a grid,
which is NP-hard, so the engine optimises for a verified-violation-free plan inside a
bounded time budget instead of chasing an optimal one.

## What it does

- **Auto seat assignment** across many halls, honouring blocked seats
- **No two candidates from the same institution sit side by side**
- **Roll order preserved** so invigilators can take attendance
- **Three strategies**: `Greedy` (naive baseline), `Balanced` (DSATUR ordering), `Strict` (repair + kick)
- **Independent validator** that re-checks any plan, including hand-edited ones
- **Manual overrides** with live re-validation, force-with-reason, and an audit trail
- **Async allocation runs** with progress polling, cancellation and idempotency
- **PDF outputs**: admit cards and per-hall attendance sheets
- **Public seat lookup** requiring roll + date of birth, rate limited
- **Multi-tenancy** enforced by EF global query filters, not application code

## Solver benchmark

Generated with `dotnet run --project tools/SeatCraft.Benchmarks -c Release`.

| Scenario | Candidates | Halls | Institutions | Strategy | Time (ms) | Violations | Halls used |
|---|---|---|---|---|---|---|---|
| Easy | 500 | 6 | 20 | Greedy | 15 | 0 | 5 |
| Easy | 500 | 6 | 20 | Strict | 2 | 0 | 5 |
| Typical | 2000 | 18 | 60 | Greedy | 1 | 0 | 14 |
| Typical | 2000 | 18 | 60 | Strict | 17 | 0 | 14 |
| Large | 5000 | 40 | 120 | Greedy | 6 | 0 | 26 |
| Large | 5000 | 40 | 120 | Strict | 83 | 0 | 26 |
| Tight | 1000 | 10 | 2 | **Greedy** | 9 | **900** | 10 |
| Tight | 1000 | 10 | 2 | **Strict** | 10 | **0** | 10 |

The `Tight` row is the point: a naive first-fit pass leaves 900 adjacency conflicts on
two large institutions, while the repair strategy resolves every one.

## Architecture

```
backend/
  src/
    SeatCraft.Domain          entities, value objects, the solver (zero I/O)
    SeatCraft.Application     use cases, contracts, abstractions
    SeatCraft.Infrastructure  EF Core, JWT, caching, locks, PDF, queue worker
    SeatCraft.Api             controllers, middleware, composition root
  tests/
    SeatCraft.Domain.Tests    solver unit tests + FsCheck property tests
    SeatCraft.Api.Tests       end-to-end API tests on real SQLite
  tools/
    SeatCraft.Benchmarks      benchmark console app
```

Dependency direction: `Api → Infrastructure → Application → Domain`.
`SeatCraft.Domain` references nothing — that is why the solver is fast to test.

### Key decisions

| Decision | Why |
|---|---|
| Solver lives in Domain with no EF or HTTP | Unit-testable, benchmarkable, deterministic |
| `SeatGrid` flattens halls into one slot graph | Adjacency is a graph lookup, not nested loops |
| Validator is independent of the solver | A hand-edited plan is checked with the same rules |
| Tenant filter at the EF layer | A forgotten `WHERE` cannot leak another tenant's data |
| Filtered unique index on active runs | The database rejects the double-start race |
| Background queue + poll | A 5,000-candidate solve never blocks an HTTP request |

## Run locally

No Docker required — SQLite and in-memory cache are the defaults.

```bash
cd backend
dotnet run --project src/SeatCraft.Api
```

Swagger: <http://localhost:5199/swagger>

### Five-minute demo

```bash
# 1. create a tenant and get a token
curl -X POST http://localhost:5199/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"tenantName":"Demo","tenantSlug":"demo","email":"admin@demo.test","password":"Passw0rd!123","displayName":"Admin"}'

# 2. seed a realistic exam (500 candidates, 20 institutions, 12 halls)
curl -X POST "http://localhost:5199/api/dev/seed-demo?candidates=500" \
  -H "Authorization: Bearer <token>"

# 3. start an allocation run
curl -X POST http://localhost:5199/api/exams/<examId>/allocation-runs \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"strategy":"Strict","seed":42}'

# 4. poll the run, then publish the resulting plan
curl http://localhost:5199/api/exams/<examId>/allocation-runs/<runId> -H "Authorization: Bearer <token>"
curl -X POST http://localhost:5199/api/exams/<examId>/seat-plans/<planId>/publish -H "Authorization: Bearer <token>"
```

### With Postgres and Redis

```bash
cd backend
docker compose up --build
```

## API surface

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Create tenant + admin |
| `POST` | `/api/auth/login` | Get access token |
| `GET` | `/api/auth/me` | Current principal |
| `GET/POST` | `/api/exams` | List / create exams |
| `PUT` | `/api/exams/{id}/constraints` | Toggle allocation rules |
| `GET/POST` | `/api/exams/{id}/halls` | Hall layout |
| `POST` | `/api/exams/{id}/halls/{hallId}/seats/{row}/{col}/block` | Block a seat |
| `GET/POST` | `/api/exams/{id}/candidates` | Paged roster |
| `POST` | `/api/exams/{id}/candidates/import` | CSV import with row errors |
| `GET/POST` | `/api/exams/{id}/allocation-runs` | List / start runs |
| `DELETE` | `/api/exams/{id}/allocation-runs/{runId}` | Cancel a run |
| `GET` | `/api/exams/{id}/seat-plans/{planId}` | Plan with violations |
| `POST` | `/api/exams/{id}/seat-plans/{planId}/swap` | Swap two seats |
| `POST` | `/api/exams/{id}/seat-plans/{planId}/move` | Move to a free seat |
| `POST` | `/api/exams/{id}/seat-plans/{planId}/publish` | Publish (admin) |
| `GET` | `/api/exams/{id}/seat-plans/{planId}/documents/admit-cards` | ZIP of PDFs |
| `GET` | `/api/exams/{id}/seat-plans/{planId}/documents/attendance-sheets` | ZIP of PDFs |
| `GET` | `/api/public/{tenantSlug}/seat-lookup` | Roll + DOB lookup |

Errors are RFC-7807 `ProblemDetails`. Tenant data is scoped from the JWT claim, never
from a request body.

## Tests

```bash
dotnet test
```

- **29 domain tests** — solver invariants, strategy differences, validator edge cases
- **Property-based tests** — FsCheck generates random hall/candidate shapes and asserts
  that no plan ever double-books a seat, assigns a candidate twice, or uses a blocked
  seat. This suite caught a real local-minimum bug in the repair pass.
- **15 integration tests** — auth, tenant isolation (returns 404, not 403), CSV import
  errors, allocation, idempotency, publish rules, and public lookup gating

## Deliberately out of scope

Payment/fee collection, SMS delivery, OMR scanning, mobile app, billing, and
real-time collaborative editing. None of them test the allocation thesis.
