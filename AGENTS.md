# Archer project guidance

This file is the project-wide engineering boundary. It applies to every
directory and every change in this repository.

## Documentation ownership

- `SPEC.md` is the product contract. Keep it focused on user-visible features,
  roles, workflows, domain rules, and acceptance behavior. It may change as
  product decisions change.
- `README.md` is the user/developer guide for running and using this checkout.
  Keep setup, commands, project layout, environment configuration, and local
  troubleshooting there.
- `app/README.md` and `api/README.md` contain implementation details specific
  to those projects and should not duplicate the full product specification.
- `AGENTS.md` is the stable engineering boundary for the whole project. Put
  ownership, invariants, security expectations, and change rules here.
- `CLAUDE.md` is a compatibility entry point for Claude-compatible tooling.
  It must point back to this file instead of defining a second set of rules.

When documents disagree, use this order: explicit user request, `SPEC.md` for
product behavior, `AGENTS.md` for engineering boundaries, then the relevant
README for operational details. Resolve contradictions instead of silently
copying them into another document.

## Repository boundaries

- `api/` owns persistence, authentication, authorization, validation, business
  workflows, and the HTTP contract.
- `app/` owns web presentation, routing, client-side state, and interaction
  flows. It must use the API contract and must not reimplement server-side
  authorization or workflow rules as a source of truth.
- A future mobile client is a separate consumer of the API. Do not introduce a
  shared runtime package or hidden coupling between clients.
- The API is the source of truth for identity, permissions, status transitions,
  and money values. Client-side checks are for usability only.
- Keep changes in the smallest responsible project. A cross-project change
  must update the API contract first or alongside its consumers and document
  the affected behavior.

## Non-negotiable domain invariants

- Supported currencies are `USD` and `MMK`; every monetary value carries its
  currency and is stored as integer minor units (`amountMinor`).
- Never silently convert, compare, or merge amounts across currencies.
- Ownership and participant checks are enforced on the API for every resource
  lookup and mutation; do not trust IDs or role flags supplied by a client.
- Job, proposal, contract, review, and message status transitions must follow
  the rules in `SPEC.md` and be rejected when the current state is invalid.
- User-generated text and URLs are untrusted. Validate at request boundaries,
  escape on rendering, and avoid exposing internal error details.
- Preserve history for user-generated records through status-based deactivation
  or soft deletion where hard deletion would make the audit trail misleading.

## Security and data handling

- Never commit secrets, real credentials, tokens, private keys, or production
  data. Use environment variables and keep local examples safe.
- Never log passwords, access/refresh tokens, sensitive personal data, or full
  message bodies. Redact secrets in errors and structured logs.
- Passwords must be hashed; refresh credentials must be revocable and stored
  safely. Authentication, refresh, registration, and password-change paths must
  be rate-limited as the API evolves.
- Do not weaken authorization to make a UI workflow pass. Fix the contract or
  the client behavior at the correct boundary.

## Change and verification rules

- Read `SPEC.md` and the nearest project README before changing a feature.
- Prefer existing patterns and dependencies. Do not add a new library when the
  current stack already solves the problem.
- Keep API changes explicit: update validation, authorization, persistence,
  response behavior, tests, and the relevant README when they change.
- Keep UI changes resilient: implement loading, empty, success, error, and
  unauthorized states for primary workflows; preserve valid form input after a
  failed submission.
- Add or update tests for changed behavior, especially authorization, money,
  state transitions, and end-to-end workflow boundaries.
- Run the narrowest useful checks first, then the relevant build and test
  commands. Report checks that could not be run and why.
- Do not reset, discard, or overwrite unrelated user changes.

## Scope discipline

Do not add payments, escrow, withdrawals, wallet balances, real-time calls,
identity verification, organizations, public third-party API access, or ML
matching unless the product specification explicitly brings them into scope.
