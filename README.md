# Archer

Archer is a freelance marketplace prototype connecting clients and freelancers.
The current checkout contains an Express/TypeScript API and a React web app.
The product behavior is described in [SPEC.md](SPEC.md); this file explains how
to run and work with the checkout.

## Project layout

```text
api/       Express API, Prisma schema/migrations, seed data, API tests
app/       React/Vite web client
SPEC.md    Product features, workflows, and acceptance behavior
AGENTS.md  Project-wide engineering boundaries and invariants
CLAUDE.md  Compatibility pointer to AGENTS.md
```

The API and web app are intentionally separate projects. Start the API before
the web app.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

In one terminal:

```powershell
cd api
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

The API listens on `http://localhost:3000`. Health endpoints are available at
`/health` and `/ready`; the versioned application API is under `/api/v1`.

In a second terminal:

```powershell
cd app
npm install
npm run dev
```

Open `http://localhost:5173`. The web app defaults to
`http://localhost:3000/api/v1`; set `VITE_API_URL` when using another API
origin.

In a third terminal, start the Expo mobile client:

```powershell
cd mobile
npm install
npm start
```


The mobile client automatically uses `10.0.2.2` for Android emulators and
`localhost` for iOS simulators and Expo Web. Physical devices must use
`EXPO_PUBLIC_API_URL` with the development computer's LAN address.

## Demo data

The seed command creates development-only users and sample marketplace data.
Seed accounts use the password `ArcherDemo123!`; see [api/README.md](api/README.md)
for the account naming pattern and API-specific details. Never use seeded
credentials outside local development.

## Useful commands

API commands run from `api/`:

```powershell
npm run build       # TypeScript build
npm test            # API test suite
npm run db:seed     # Recreate development seed data when explicitly needed
```

App commands run from `app/`:

```powershell
npm run build       # TypeScript check and Vite production build
npm run preview     # Preview the production build
```

For project-specific API or app behavior, use the corresponding README. For
product decisions, use [SPEC.md](SPEC.md). For changes that affect the whole
checkout, follow [AGENTS.md](AGENTS.md).


Mobile commands run from `mobile/`:

```powershell
npm run typecheck    # TypeScript check
npm start            # Start Expo
```
