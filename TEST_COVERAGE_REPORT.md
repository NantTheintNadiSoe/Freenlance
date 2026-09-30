# Test Coverage Review

## Executive summary

The repository has a small API smoke suite but no meaningful automated test
coverage for the product's critical workflows. The existing suite contains
four tests in `api/tests/api.test.ts`:

- health response
- seeded-account login
- open-job listing pagination metadata
- rejection of an unauthenticated protected request

There are no test files or test scripts for `app/` or `mobile/`, and no
coverage configuration or measured coverage report was found. The API now has an
additional focused integration suite in `api/tests/critical-workflows.test.ts`.

The highest risk is not untested presentation detail. It is the absence of
tests around API authorization, money/currency invariants, state transitions,
and the end-to-end client workflow that turns a job into a contract, messages,
completion, and reviews.

## Current test inventory

| Area | Current evidence | Assessment |
| --- | --- | --- |
| API | 1 test file, 4 tests | Smoke coverage only |
| API route families | Auth, jobs, proposals, contracts, messages, notifications, profiles, reviews, health | Mostly untested |
| Web app | No test dependency, script, or test file found | Untested |
| Mobile app | No test dependency, script, or test file found | Untested |
| Coverage measurement | No coverage script/config/report found | Coverage percentage unavailable |
| Product journey | No multi-step integration test found | Critical gap |

The API test suite uses `createApp()` and seeded demo credentials. The review
did not verify database isolation or execute the suite, so those should be
confirmed when the test harness is expanded.

## Priority coverage gaps

### P0 — protect product and security invariants

These should be covered before adding broad component-level tests.

1. **Authentication and session security**
   - registration validation, normalized email, supported role/currency
   - invalid credentials and unavailable accounts
   - access-token authentication, malformed/expired tokens, and refresh-token
     rotation/revocation/expiry
   - logout invalidating a refresh credential
   - change-password success, wrong current password, and authenticated access
   - user data returned by `/auth/me` without sensitive fields

2. **Authorization and resource ownership**
   - a client cannot mutate another client's job
   - a freelancer cannot mutate another freelancer's portfolio or proposal
   - only the job owner can reject, shortlist, or accept proposals
   - only contract participants can view a contract, conversation, or messages
   - inactive users and unauthorized roles are rejected consistently
   - admin-only behavior and audit events, where implemented by the API

3. **Money and currency validation**
   - only `USD` and `MMK` are accepted
   - amounts are integer, non-negative minor units
   - proposal currency must match job currency
   - malformed, negative, fractional, or missing monetary values are rejected
   - no implicit cross-currency comparison or conversion occurs

4. **Lifecycle and hiring invariants**
   - valid and invalid job transitions: `DRAFT`, `OPEN`, `PAUSED`, `CLOSED`,
     `HIRED`, and `CANCELLED`
   - proposals are accepted only on open jobs
   - one active proposal per freelancer per job
   - withdraw/edit/reject/shortlist behavior for each relevant proposal state
   - accepting one proposal rejects competing active proposals, marks the job
     `HIRED`, and creates exactly one pending contract
   - repeated or concurrent acceptance cannot create duplicate contracts
   - contract transitions: `PENDING -> ACTIVE/CANCELLED` and
     `ACTIVE -> COMPLETED/CANCELLED`; terminal states reject further changes

### P1 — verify core collaboration and history

5. **Messages and conversations**
   - conversation creation/find behavior for valid participants
   - message validation and trimming/length limits
   - participant-only reads and sends
   - invalid recipient, contract, or conversation references
   - message history remains readable after related status changes

6. **Reviews and ratings**
   - only participants of a completed contract can review
   - a participant can review the other participant, not themselves
   - rating bounds 1–5 and comment/title validation
   - one review per participant per contract
   - rating aggregates and completed-contract counts update correctly

7. **Jobs and proposals API behavior**
   - create/edit/list/detail/mine behavior with pagination, search, status, and
     currency filters
   - hidden/non-open jobs are not exposed through open-job discovery
   - invalid IDs, invalid query parameters, empty result sets, and validation
     error field responses
   - proposal list/detail visibility matches the caller's role and ownership

8. **Notifications and auditability**
   - relevant events create notifications for the intended recipient
   - users cannot read or mark another user's notification
   - single and mark-all read operations are idempotent
   - important moderation/admin actions retain an audit trail

### P2 — client workflow and resilience coverage

9. **Web API client and authentication state**
   - adds authorization headers and JSON content type correctly
   - refreshes once on a 401, retries the original request, and clears the
     session when refresh fails
   - preserves API validation fields and handles 204 responses
   - login, registration, logout, restore-session, and unauthorized routing

10. **Web primary workflows**
    - job discovery loading, empty, error, filtering, and detail states
    - client job creation and status management
    - proposal submission, shortlist, hire, and error handling
    - dashboard role-specific queries and contract/review flows
    - conversations, send-message behavior, notifications/read state, profile
      editing, and portfolio management
    - USD/MMK display and form conversion to minor units without conversion
      between currencies

11. **Mobile current slice**
    - secure session storage and web fallback behavior
    - API refresh/retry behavior and error parsing
    - login/register/session restore/logout navigation
    - job list search, pull-to-refresh, empty/error states, job detail, and
      proposal amount conversion for USD versus MMK
    - safe-area/navigation behavior and retry handling on network failure

## Recommended lean test plan

The project does not need a test for every presentational component. A useful
minimum suite would be:

1. **API route integration tests** using an isolated test database and seeded
   fixtures for two clients, two freelancers, an admin, jobs, proposals, and
   contracts.
2. **One complete acceptance journey** covering register/login, publish job,
   submit proposal, accept proposal, contract activation/completion, messages,
   and reviews.
3. **A focused negative-path matrix** for ownership, role checks, currencies,
   malformed input, and invalid state transitions.
4. **Small unit tests** for token helpers, pagination, money formatting/minor
   unit conversion, API refresh/retry, secure storage, and notification
   aggregation.
5. **A small web and mobile smoke layer** for authentication, job discovery,
   proposal submission, and primary loading/error/empty states.

## Suggested prioritization

| Priority | Initial target | Why |
| --- | --- | --- |
| P0 | Auth, ownership, money, hiring, contract transitions | Security and data-integrity failures would undermine the marketplace |
| P1 | Messages, reviews, notifications, job/proposal edge cases | Protects privacy, reputation, and history |
| P2 | Web/mobile API adapters and primary screens | Catches client/API integration regressions without testing every component |

## Definition of adequate coverage for this product

Coverage should be judged by protected behavior, not only line percentage. The
minimum bar should be that every API route family has success, validation
failure, unauthorized/forbidden, not-found, and invalid-state coverage where
those cases apply; the primary acceptance journey passes end to end; and both
clients exercise their authentication and job/proposal paths against mocked or
contract-checked API responses.

After those tests exist, add a coverage reporter and use the report to find
unreachable branches. A single global percentage should not be treated as
evidence that authorization, currency, and lifecycle rules are safe.

## Scope note

The web and mobile clients remain untested. API tests were added and run; no
web or mobile tests were written. The validation error middleware was updated
to return 400 with a stable `VALIDATION_ERROR` code for malformed requests. The findings are based on repository inspection against `SPEC.md`,
the project READMEs, existing test files, route declarations, and client API
usage.
