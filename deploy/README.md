# Deployment

Two compose stacks on one host, fronted by nginx:

- `backend/docker-compose.prod.yml` — Postgres 16 + the API on `$API_PORT` (1890 here).
- `frontend/docker-compose.prod.yml` — the Next.js standalone server on `127.0.0.1:3000`,
  joined to the API stack's `seatcraft_default` network so it reaches the API as `http://api:8080`.
- `deploy/nginx/seatcraft.duckdns.org.conf` — `/api`, `/swagger`, `/health` → API, everything else → web.

## First run

```bash
cp backend/.env.example backend/.env   # POSTGRES_PASSWORD, JWT_SIGNING_KEY, API_PORT=1890
cd backend  && docker compose -f docker-compose.prod.yml up -d --build
cd ../frontend && docker compose -f docker-compose.prod.yml up -d --build
```

The API applies migrations at startup, so the database is ready on first boot.

## nginx + TLS

```bash
sudo cp deploy/nginx/seatcraft.duckdns.org.conf /etc/nginx/sites-available/seatcraft.duckdns.org
sudo ln -sf /etc/nginx/sites-available/seatcraft.duckdns.org /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d seatcraft.duckdns.org
```

Certbot needs the A record to point at this host before it can validate.

## Redeploy

```bash
git pull
cd backend  && docker compose -f docker-compose.prod.yml up -d --build
cd ../frontend && docker compose -f docker-compose.prod.yml up -d --build
```

## Notes

- `SEATCRAFT_API_ORIGIN` in the web stack is the in-network API address (`http://api:8080`).
- `SEATCRAFT_PUBLIC_API_ORIGIN` stays empty: nginx serves `/api` on the same origin, so document
  links stay cookie-free and are streamed straight from the API.
- Do not publish the Postgres port; only nginx and `$API_PORT` are exposed.
