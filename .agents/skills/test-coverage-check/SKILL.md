---
name: test-coverage-check
description: Inspect a repository's tests and critical product behavior, then write a timestamped, implementation-ready coverage findings report without writing or running tests.
---

# Test Coverage Check

Use this skill when the user asks for a test coverage review, coverage check,
test-gap audit, or a report for another agent to implement. This skill is
read-only with respect to product code and tests.

## Non-negotiable boundaries

- Do not write, edit, or delete tests or production code.
- Do not run tests, builds, coverage commands, package installation, database
  migrations, seed commands, dev servers, or other commands that execute the
  project.
- The only permitted write is the generated Markdown report and its dedicated
  output folder at the repository root: `test-coverage-check/`.
- Do not claim measured line, branch, or statement coverage unless an existing
  report is inspected. If no report exists, label the result a static
  assessment and say that no tests were run.

## Review workflow

1. Establish the repository root and read the project-wide engineering
   instructions, product specification, and the nearest README files before
   assessing behavior.
2. Inventory test files, test scripts, coverage configuration, existing
   coverage artifacts, and test fixtures using read-only file/search commands.
   Inspect package manifests but do not execute their scripts.
3. Map user-visible critical workflows and domain invariants from the
   specification to implementation boundaries. For this project, pay special
   attention to API authorization and participant checks, authentication and
   refresh sessions, USD/MMK integer minor-unit handling, job/proposal/contract
   transitions, messaging privacy, reviews, notifications, and web/mobile API
   integration.
4. Inspect relevant routes, services, persistence models, client API adapters,
   and primary screens to determine which behaviors have evidence in tests and
   which do not. Distinguish tested behavior from code that merely exists.
5. Prioritize findings by risk and implementation value:
   - P0: security, data integrity, money/currency, ownership, or core workflow
     failures.
   - P1: privacy, lifecycle edge cases, history, notifications, and important
     validation behavior.
   - P2: client adapters, loading/error/empty states, formatting, and lower-risk
     presentation behavior.
6. Write one report at
   `test-coverage-check/coverage-report-YYYYMMDD-HHmmss.md` using the local
   project time zone. If a same-second filename exists, add `-01`, `-02`, and
   so on rather than overwriting it.

## Report requirements

The report is for a specific implementation agent. Include:

- review timestamp and repository scope
- an executive summary of current evidence
- test inventory by project and whether coverage is measured
- critical workflow/invariant matrix with evidence and gaps
- prioritized findings with concrete behavior, likely test boundary, and
  acceptance assertions
- a lean recommended test plan that avoids testing every unit
- explicit limitations, including commands not run and files not modified

Use file paths and line numbers when they materially help the implementer.
Avoid prescribing a global percentage as the goal; behavior and risk coverage
are the primary measures. Keep findings evidence-based and do not invent
failures that were not observed.

## Completion check

Before finishing, verify only that the report exists, is valid Markdown, has a
timestamped filename under the dedicated root folder, and that no other
workspace files were changed. Do not run a test or build as part of this
verification.