# Archer API

Express + TypeScript API for Archer. This project is intentionally independent from the web and mobile clients.

## Setup

```bash
npm install
Copy-Item .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The API runs at `http://localhost:3000`. Health checks are available at `/health` and `/ready`.

All seed accounts use the password `ArcherDemo123!`. Seed emails follow `client1@archer.demo` and `freelancer13@archer.demo` (the first freelancer is the 13th seeded user).

## API surface

The versioned API base path is `/api/v1`:

- `/auth` including `POST /auth/change-password`
- `/jobs` including `PATCH /jobs/:jobId/status` (`OPEN`, `PAUSED`, `CLOSED`, `CANCELLED`)
- `/proposals` including reject, shortlist, accept, and withdraw
- `/contracts`
- `/conversations`
- `/notifications`
- `/reviews`
- `/profiles`

Money is stored as integer minor units and always includes `USD` or `MMK` currency. Proposal currency must match its job currency. Payment processing is not implemented.
