# SeatCraft

Exam seat allocation and admit-card engine — a portfolio project modelled on the domain
of OnnoRokom Projukti's *E-Recruitment Pro*.

## The problem

Exam centres must seat thousands of candidates across dozens of halls such that no two
candidates from the same institution sit adjacent — otherwise neighbours can compare
answers. That is graph colouring on a grid, which is NP-hard.

SeatCraft solves it with DSATUR-style sequential colouring plus an iterative repair pass,
then verifies every plan with an independent validator.

## Layout

| Folder | Contents |
|---|---|
| `backend/` | .NET 9 solution: Domain, Application, Infrastructure, Api, tests |
| `frontend/` | Next.js console (not started yet) |

## Quick start

```bash
cd backend
dotnet run --project src/SeatCraft.Api
```

Swagger UI: <http://localhost:5199/swagger>
