# API Security Audit — 2026-09-30

## Executive summary

The API has several sound baseline controls: passwords are bcrypt-hashed, refresh tokens are stored as SHA-256 hashes and rotated, bearer tokens are checked against the current account status, most resource mutations perform ownership checks, Helmet is enabled, and request bodies have a 1 MB limit.

The audit found **two high-severity findings and three medium-severity findings**. The highest-priority issues are the ability to run production with publicly known JWT signing secrets and unauthenticated access to non-public job data. The messaging API also accepts relationship IDs without validating that they belong together, and authentication endpoints have no abuse controls.

No application code was changed by this audit.

## Scope and approach

- Scope: `api/src`, `api/prisma`, API tests, API configuration, and the API README.
- Reviewed authentication, session and token handling, authorization/IDOR boundaries, input validation, state transitions, sensitive data exposure, logging, and abuse resistance.
- Read `SPEC.md`, `AGENTS.md`, and `api/README.md` before review.
- Verification performed:
  - `npm test` — passed: 2 test files, 11 tests.
  - `npm run build` — passed.
- The repository had pre-existing working-tree changes; they were preserved.
- This was a source review. No production deployment, external penetration test, dependency vulnerability scan, or load test was performed.

## Findings

### [High] Production can use known JWT signing secrets

**Location:** `api/src/config/env.ts:6-7`, `api/src/lib/auth.ts:22-31`

`JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` have predictable development defaults, and the schema does not reject those defaults when `NODE_ENV=production`. The access-token secret is used to sign and verify bearer tokens. If a production deployment omits the environment variable, an attacker who knows the repository defaults can forge a valid access token with another user's `sub` and pass `requireAuth`.

The refresh secret is currently unused because refresh tokens are opaque random values, which is a separate configuration defect and increases the chance that operators believe refresh signing is protected when it is not relevant to the implementation.

**Impact:** Account impersonation and unauthorized access to any resource reachable by the forged subject; potentially administrative access if an admin subject is known.

**Recommendation:** Require high-entropy secrets in production and fail startup if they are absent or equal to development defaults. Prefer a dedicated secret-management mechanism and document rotation. Remove unused `JWT_REFRESH_SECRET`, or implement and test a deliberate refresh-token design using it.

### [High] Public job endpoints expose non-public jobs

**Location:** `api/src/routes/jobs.ts:51-73`

The public list endpoint defaults to `OPEN`, but accepts any caller-supplied `status` without restricting it to `OPEN` (`lines 54-61`). The public detail endpoint has no authentication and does not require the job to be `OPEN` (`lines 70-73`). An unauthenticated caller can therefore enumerate or fetch `DRAFT`, `PAUSED`, `HIRED`, `CLOSED`, or `CANCELLED` jobs, including descriptions, budgets, client profile data, skills, and proposal counts.

This conflicts with the product boundary that freelancers discover open jobs and that client-owned job management is private.

**Impact:** Confidential draft and historical job disclosure, leakage of client and commercial information, and unintended publication of proposal-count metadata.

**Recommendation:** Make public listing and public detail explicitly constrain results to `status: "OPEN"`. If owners or admins need other statuses, provide authenticated owner/admin paths with resource-level authorization. Add tests for every non-open status.

### [Medium] Conversation creation does not validate participant/resource relationships

**Location:** `api/src/routes/messages.ts:10-17`

The create-conversation endpoint accepts `recipientId`, `jobId`, and `contractId`, verifies only that the recipient is active, then writes all supplied IDs directly. It does not verify that:

- the recipient has the opposite participant role;
- the caller and recipient are associated with the supplied job;
- the caller and recipient are participants in the supplied contract;
- the supplied job and contract refer to the same workflow.

The subsequent read paths correctly restrict access to conversation participants, so this is primarily an integrity and workflow-isolation issue rather than an immediate read-only IDOR. It nevertheless permits forged conversation records attached to unrelated jobs/contracts and can create misleading cross-workflow notifications and audit history.

**Impact:** Cross-workflow data pollution, misleading audit/history records, and possible future authorization bypass if downstream code trusts the conversation's foreign keys.

**Recommendation:** Derive the conversation context server-side. When `contractId` is supplied, require the caller and recipient to be the contract's two participants and require the job to match the contract. When only `jobId` is supplied, require the caller to own the job and the recipient to be an eligible freelancer (or enforce the intended proposal relationship). Reject inconsistent or unrelated IDs.

### [Medium] Authentication and credential-changing endpoints lack rate limiting

**Location:** `api/src/app.ts:27-35`, `api/src/routes/auth.ts:35-119`

The registration, login, refresh, logout, and change-password routes are mounted without IP/account throttling, lockout/backoff, or a comparable abuse-control mechanism. The API has no rate-limiting dependency or middleware in the current package/configuration.

**Impact:** Credential stuffing and password-guessing attempts, automated account creation, refresh-token abuse, and increased bcrypt/database resource consumption. The 1 MB JSON limit does not mitigate request-rate abuse.

**Recommendation:** Add route-specific rate limits, with tighter limits for login, registration, refresh, and password changes. Use bounded account/IP backoff, preserve generic login failures, and instrument/redact security events. Ensure limits work correctly behind the deployment proxy.

### [Medium] Message history is returned without pagination or a result cap

**Location:** `api/src/routes/messages.ts:29-33`

An authorized participant can request a conversation and receive every message in ascending order. Message creation allows up to 5,000 characters per message, but there is no server-side history limit, cursor, or maximum response size. A long-lived conversation can cause expensive database reads and large responses, and an authorized user can repeatedly trigger that work.

**Impact:** Availability and resource-exhaustion risk on conversation endpoints, especially as message history grows.

**Recommendation:** Add cursor-based pagination with a conservative maximum page size, return newest messages by default, and require explicit pagination for older history. Add indexes and response-size monitoring as needed.

## Additional observations and coverage gaps

- `refreshTokenExpiry()` in `api/src/lib/auth.ts:41-44` always adds 30 days and ignores the configured `REFRESH_TOKEN_TTL` in `api/src/config/env.ts:9`. This is a configuration/operational correctness issue and should be fixed while hardening token policy.
- Login distinguishes invalid credentials (`401`) from unavailable accounts (`403`) at `api/src/routes/auth.ts:56-59`, which can aid account-status enumeration. Consider a uniform external response while retaining an internal audit signal.
- `api/src/routes/reviews.ts:20-23` creates a review and then updates the rating summary in separate operations. The unique constraint prevents duplicate reviews, but concurrent review writes can leave an inconsistent aggregate unless creation and summary maintenance are made transactional or recomputed safely.
- Public profile and job responses should be reviewed against the minimum-necessary disclosure policy; user-generated URLs and text are validated, but downstream clients must still escape/render them safely.
- Security-focused tests are missing for production configuration validation, non-open public job access, conversation context binding, rate-limit behavior, response pagination, and token abuse cases.

## Suggested remediation order

1. Fail closed on production JWT secret configuration and rotate any potentially exposed deployment secrets.
2. Restrict public job reads to `OPEN` and add authorization tests for every other status.
3. Validate message participant/job/contract relationships before creating conversations.
4. Add and test route-specific authentication throttling.
5. Paginate conversation history and address the token TTL configuration mismatch.

