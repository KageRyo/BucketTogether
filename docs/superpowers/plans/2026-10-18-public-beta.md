# Public beta implementation plan

Goal: deliver the approved public beta with LINE, Discord and Google sign-in, Supabase PostgreSQL storage, private shared lists, expiring invitations, conflict detection and account deletion.

Architecture: keep NextAuth JWT sessions and the DataRepository boundary. Supabase uses PostgreSQL transactions via its server-only transaction pooler (prepared statements disabled); browser clients never access tables. Local JSON remains for development. Production rejects the local backend and development credentials.

Execution: native implementation in this session, with focused failing regression tests before behavioral changes. Commit logical deliverables using Conventional Commits with no attribution trailers. No remote publication or real user-data mutations.

- [x] Extend identity, invite, version and deletion contracts and regression tests; implement local behavior with migration of existing local data.
- [x] Add normalized versioned PostgreSQL migrations and Supabase repository; run the same contract tests against disposable Docker Desktop PostgreSQL, including transaction races and rate limiting.
- [x] Add configurable OAuth providers, explicit session-bound identity linking, live session revocation and protected mutation routes.
- [x] Complete share-link acceptance, full item editing, visibility-aware polling, conflict recovery, settings and mobile navigation.
- [x] Add CI, deployment/backup/restore procedures, health/error reporting, privacy and terms. Run lint, type-check, full tests, build and browser flow.

Decisions: no automatic Email merges; provider IDs are the identity authority. Email optional. Invite tokens are random 256-bit secrets, stored hashed, valid seven days and consumed atomically. Accepted existing members keep their role. List/item versions are monotonic integers. List data stays private, including legacy isPublic data. Account deletion removes owned lists and memberships and anonymizes authorship on other lists. Production rate limiting lives in PostgreSQL; local mode uses an in-process limiter only for development.

External gates: real OAuth callbacks require provider credentials and a registered HTTPS domain. Vercel/Supabase production provisioning, billing decisions and backup-region/contact details require operator configuration. Document and validate configuration; do not claim production deployment from local checks.

Validation ledger:

- Baseline: 6 tests passed. New shared contracts initially failed on missing identity/invite methods, then passed on local and PostgreSQL.
- PostgreSQL races: first OAuth login, invitation acceptance, optimistic item updates and shared rate limiting exercised against PostgreSQL 17 on Docker Desktop.
- Read-only independent review found and corrected public legacy email invitations and implicit draft baseline rebasing. The email-invite regression was observed failing before the fix.
- Browser: invitation returned 403 before acceptance; accepted editor could edit; another user update arrived through polling; draft stayed intact with save/reopen blocked until explicit comparison; completed contribution survived account deletion with null authorship, and the old session returned 401. Mobile viewport checked at 390px.
- Migration applied once and then skipped correctly; verified TLS connection to a disposable PostgreSQL instance. A pg_dump/pg_restore rehearsal restored matching users/lists/membership/item counts into a separate test database.
- External OAuth provider callbacks, hosted CI, production deployment, alert subscriptions and production backup configuration remain operator gates, not verified live.

- Final clean-install verification: 41 tests passed (including unprivileged RLS reads), lint/type-check/build passed; runtime npm audit is clean. Full development audit retains five high reports through the same unpatched ESLint -> fast-glob -> micromatch -> braces chain; do not downgrade Next's ESLint config to mask this.
- Production-mode localhost smoke against verified-TLS PostgreSQL: health/account 200, list creation 201, cross-origin/legacy-email writes 403, stale write 409, account deletion 200, old session 401. Fake OAuth client credentials only exercised provider configuration; no real provider callback was claimed.
- Visual review caught Tocas flex-column widths unaffected by grid-template-only CSS; fixed mobile grids and verified every child occupies the single column at 390px. Removed a legacy icons stylesheet URL confirmed to return HTTP 404.
