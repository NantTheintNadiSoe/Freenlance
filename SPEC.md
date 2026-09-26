# Archer product specification

This document describes what Archer should do. It is the product source of
truth for user-visible features, workflows, roles, and domain behavior. It is
intentionally implementation-agnostic: repository boundaries, setup, stack
choices, and engineering rules belong in `AGENTS.md` and the relevant README.

## Product summary

Archer is a freelance marketplace connecting clients with freelancers. The
first release supports profiles, jobs, proposals, contracts, messaging,
reviews, notifications, and dashboards across web and mobile clients using the
same API. Payment processing is out of scope, but money values support `USD`
and `MMK` from the first release.

## Goals

- Let clients publish and manage freelance jobs.
- Let freelancers discover jobs and submit proposals.
- Let clients accept a proposal and create a contract.
- Let both parties track contract status and communicate.
- Provide trustworthy profile, portfolio, rating, and review information.
- Provide coherent web and mobile experiences.
- Provide realistic sample data for development and demos.

## Out of scope for the first release

- Payment gateways, escrow, invoices, withdrawals, or wallet balances.
- Real-time audio/video calls.
- Tax, identity, or legal-document verification.
- Multi-tenant organizations or team accounts.
- Advanced recommendation or machine-learning matching.
- Public third-party API access.

## User roles

### Client

- Create and manage a profile.
- Publish jobs and manage their lifecycle.
- Review proposals and hire a freelancer.
- Manage active contracts and communicate with freelancers.
- Leave a review after a contract is completed.

### Freelancer

- Create a profile with skills, bio, hourly rate, availability, and portfolio.
- Browse, search, and filter open jobs.
- Submit, edit, or withdraw proposals before hiring.
- Manage active contracts and communicate with clients.
- Leave a review after a contract is completed.

### Admin

Admins are API-supported in the first release. They can view users, jobs,
proposals, contracts, reports, and audit events, and can suspend/restore users
or moderate jobs and content. An admin UI is not required yet.

An account may be both a client and a freelancer. The active role is a UI
preference; permissions are determined by the resource and action.

## Core features

### Accounts and profiles

- Register, sign in, sign out, restore a session, and change a password.
- Edit account/profile details including display name, avatar, bio, location,
  languages, availability, and hourly rate.
- Add normalized skills and portfolio items.
- View public freelancer profiles with portfolio, rating summary, and completed
  contract count.

### Jobs and proposals

- Clients create drafts, publish jobs, edit them, pause them, close them, or
  cancel them.
- A job includes a title, description, category, skills, budget, currency,
  experience level, location mode, and optional deadline.
- Freelancers browse, search, filter, and view open jobs.
- A freelancer can submit, edit, or withdraw one active proposal per job.
- A proposal includes a cover letter, amount, currency, and estimated duration.
- Job owners can shortlist, reject, or accept proposals.
- Accepting a proposal creates one contract and prevents another proposal from
  being accepted for that job.

### Contracts and collaboration

- Participants can view contracts and their status.
- Contract statuses are `PENDING`, `ACTIVE`, `COMPLETED`, `CANCELLED`, and
  `DISPUTED`.
- Contract participants can use a related conversation to send and read
  messages.
- Participants receive notifications for relevant account, job, proposal,
  contract, message, and review events.

### Reviews and moderation

- Each participant may leave one review for the other participant after a
  completed contract.
- A review contains a rating from 1 to 5, title, and comment.
- Users can report users or content. Moderation state and important admin
  actions remain auditable.
- User-generated records should retain enough history that past contracts,
  reviews, and moderation actions remain understandable.

### Dashboards

- Clients see job, proposal, contract, message, and notification activity
  relevant to their work.
- Freelancers see discovery, proposal, contract, profile, message, and
  notification activity relevant to their work.
- Primary workflows expose useful loading, empty, success, error, and
  unauthorized states.

## Domain rules

### Job lifecycle

Jobs may be `DRAFT`, `OPEN`, `PAUSED`, `CLOSED`, `HIRED`, or `CANCELLED`.
Only an open job accepts proposals or can have a proposal accepted. Hiring
moves the job to `HIRED`; invalid transitions are rejected.

### Proposal lifecycle

Proposals may be `SUBMITTED`, `SHORTLISTED`, `REJECTED`, `WITHDRAWN`, or
`ACCEPTED`. A freelancer cannot have more than one active proposal for the same
job. Only the job owner can shortlist, reject, or accept proposals.

### Money and currency

- Only `USD` and `MMK` are supported initially.
- Every amount includes its currency; no bare monetary number is meaningful.
- Amounts are represented as integer minor units. USD uses cents; MMK uses
  whole kyat units.
- The product never implies conversion or compares values across currencies
  without an explicitly supplied exchange rate.
- Negative or unsupported amounts are invalid.
- Proposal currency must match the job currency.
- The UI always displays the currency code or symbol beside an amount.

### Access and privacy

- Clients can mutate only their own jobs.
- Freelancers can mutate only their own profile, portfolio, and proposals.
- Only contract participants can view its conversation and messages.
- Only participants in a completed contract can create its reviews.
- Admin actions require admin permission and create an audit event.

## Primary acceptance journey

1. A client registers or signs in and publishes a job in `USD` or `MMK`.
2. A freelancer signs in, finds the job, and submits a proposal in the same
   currency.
3. The client reviews and accepts the proposal; a contract is visible to both
   parties.
4. The participants exchange messages and complete the contract.
5. Both participants can leave a review, and the resulting ratings appear on
   their profiles.

Invalid permissions, unsupported currencies, malformed input, and invalid state
transitions must be rejected clearly at the API boundary and represented
clearly by clients.

## Client surfaces

The web and mobile clients should support the same account permissions and core
workflow: onboarding, authentication, job discovery, job management, proposal
management, contracts, messages, notifications, profiles, and reviews. Mobile
should additionally use native navigation, safe areas, secure credential
storage, pull-to-refresh, and network retry patterns.

## Open product decisions

These can remain implementation defaults until product requirements change:

1. Whether web refresh credentials use httpOnly cookies or a bearer strategy.
2. Whether MVP messaging refreshes by polling before WebSockets are added.
3. Whether launch UI supports fixed-price jobs only or also hourly jobs.
4. How remote, on-site, and hybrid location filters should behave.
5. Whether registration remains email/password only before social login.
6. Final logo, colors, typography, and brand copy.
