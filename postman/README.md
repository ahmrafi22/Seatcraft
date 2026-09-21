# Postman collection

Executable API collection for SeatCraft. **64 requests, 132 assertions**, verified green
against a live API with Newman.

## Files

| File | Purpose |
|---|---|
| `SeatCraft.postman_collection.json` | The collection (13 folders) |
| `SeatCraft.local.postman_environment.json` | `baseUrl`, demo credentials, captured ids |
| `fixtures/candidates.csv` | 60 candidates across C1–C6, with dates of birth |
| `fixtures/candidates-invalid.csv` | 2 valid + 4 broken rows, to exercise import errors |

## Quick start

```bash
# 1. run the API
cd backend
dotnet run --project src/SeatCraft.Api

# 2. import both JSON files into Postman and select "SeatCraft - Local"
#    or run headless:
cd postman
npx newman run SeatCraft.postman_collection.json \
  -e SeatCraft.local.postman_environment.json
```

Run from the `postman/` folder — Newman resolves fixture paths relative to the working
directory.

## Folders

| Folder | Requests | Covers |
|---|---|---|
| 00 - Health | 2 | liveness, readiness |
| 01 - Auth | 4 | register, login, me, wrong password |
| 02 - Exams | 5 | create, list, get, update, constraints |
| 03 - Institutions | 4 | create C1, loop C2–C6, list, delete |
| 04 - Halls | 7 | create ×2, list, layout, block/unblock, out-of-bounds |
| 05 - Candidates | 7 | create, CSV import, bad-row import, paging, search, delete guard |
| 06 - Allocation | 6 | start Strict, poll, list, start Greedy, poll, cancel |
| 07 - Seat Plans | 8 | get, revalidate, swap, forced swap, move, publish, immutability |
| 08 - Documents | 2 | admit-card ZIP, attendance-sheet ZIP |
| 09 - Public Lookup | 3 | happy path, wrong DOB, unknown tenant |
| 10 - Security | 3 | 401, unknown id, cross-tenant read |
| 11 - Cleanup | 3 | delete plan, archive, delete exam |
| 12 - Demo Seed | 3 | seed 500 candidates, run, poll |

## Design notes

**Re-runnable.** `Register Tenant` accepts 409 and the following `Login` always fetches a
fresh token, so the collection survives repeated runs against the same database.

**Environment, not collection, variables.** Postman resolves environment scope *above*
collection scope. Writing captured ids to collection variables while the environment also
defines them silently keeps the empty environment value — so every capture goes to the
environment.

**Loops use `pm.execution.setNextRequest`.** Institution creation (C2–C6) and all three
run polls are self-repeating requests with an attempt counter, capped at 30 so a stuck
run fails the assertion instead of hanging the run.

**Advisory vs blocking violations.** The solver guarantees no same-institution adjacency.
Roll-order is advisory and may appear in the violation list without blocking publish, so
tests filter to blocking kinds before asserting.

**Throwaway data.** The institution-delete test creates a temporary institution in a
pre-request script so it never removes C1–C6, which the CSV fixture depends on.

## What running this found

The collection is a real test, not documentation. Executing it surfaced four API bugs
that unit and integration tests had missed:

1. **Swap/move returned 500** — `ReplaceAssignments` cleared and re-added owned entities,
   so EF issued updates against rows that no longer existed. Fixed by mutating assignments
   in place and covered by new `SeatPlanTests`.
2. **Public lookup 404'd after re-runs** — it picked the first candidate matching a roll
   across all exams, including archived ones. Now restricted to currently published exams.
3. **Demo seed 409'd on second run** — it re-created institutions by code. Now reuses
   existing ones.
4. **Cancel on a finished run returned 400** — a state conflict, not a malformed request.
   Now 409.
