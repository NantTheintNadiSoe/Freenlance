# Archer App

Complete React web client for Archer. It uses React Router, TanStack React Query, Tailwind, and shadcn/ui configuration with preset `beEhfqy2`.

## Run

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

The API must be running at `http://localhost:3000`. Open `http://localhost:5173`.

## Implemented workflows

- Authentication and session refresh
- Job discovery, search, filters, pagination, detail, and proposals
- Client job creation, owned-job management, and proposal shortlisting/hiring
- Freelancer discovery, public profiles, skills, portfolio, and reviews
- Dashboard, contracts, completion, cancellation, and review creation
- Conversations, message threads, and sending messages
- Notifications and read state
- Profile editing and freelancer portfolio management
- USD/MMK display without implicit conversion
- English and Burmese interface translations with a persistent language switcher

## Languages

The web app supports English (`en`) and Burmese (`my`). Use the language
switcher in the public header or authenticated workspace header. The choice is
stored locally under `archer_language` and date/money formatting follows the
selected locale. User-generated content from the API is not translated.
