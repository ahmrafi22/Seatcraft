# SeatCraft

<p align="center">
  <img src="frontend/intro.gif" alt="SeatCraft — allocation run and hall plan" width="920" />
</p>

Exam seat allocation and admit-card engine — place every candidate in a hall
without seating two from the same institution together, then issue signed admit
cards and a public seat lookup from the same plan.

## The problem

Exam centres must seat thousands of candidates across dozens of halls such that no two
candidates from the same institution sit adjacent — otherwise neighbours can compare
answers. That is graph colouring on a grid, which is NP-hard.

SeatCraft solves it with DSATUR-style sequential colouring plus an iterative repair pass,
then verifies the result with an independent validator. It produces zero-violation plans
for 5,000 candidates in well under a second, then issues signed admit cards and a public
seat lookup from the same plan.

## Tech stack

<p>
  <img src="https://go-skill-icons.vercel.app/api/icons?i=dotnet,sqlite,postgres,redis,typescript,react,nextjs,tailwindcss,docker,nginx" />
</p>

- **Backend** — .NET 9, EF Core (SQLite in dev, Postgres in prod), JWT auth, QuestPDF,
  Serilog, xUnit + FsCheck tests, benchmarks
- **Frontend** — Next.js 16, TypeScript, React 19, Tailwind CSS 4, React Icons
- **Infra** — Docker, nginx with HTTPS, deployed on a VPS

| Folder | Contents |
|---|---|
| [`backend/`](backend/README.md) | .NET 9 API: solver, EF Core, JWT, PDFs, tests, benchmarks |
| [`frontend/`](frontend/README.md) | Next.js app: landing, workspace, seat plan editor, lookup |

## Quick start

```bash
cd backend
dotnet run --project src/SeatCraft.Api
```

Swagger UI: <http://localhost:5199/swagger>

Full setup, API reference and benchmark table: [`backend/README.md`](backend/README.md).
