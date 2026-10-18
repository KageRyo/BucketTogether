# 架構與權限

```text
Browser → Next.js pages / Route Handlers → NextAuth JWT → DataRepository
                                                        ├─ local JSON (development)
                                                        └─ Supabase PostgreSQL (production)
```

## Authentication

LINE, Discord and Google use NextAuth OAuth state/PKCE checks and one application-user namespace. `oauth_identities(provider, provider_account_id)` uniquely identifies the external identity; `(user_id, provider)` permits one identity from each platform per account. Email is optional and non-unique and never links accounts automatically.

Explicit linking starts with a same-origin, authenticated POST. An encrypted five-minute HttpOnly cookie binds the intent to the current user, session ID, provider and the OAuth authorization state's value. The callback checks all four before linking. Conflicting identities fail; there is no account-merging endpoint. No OAuth access/refresh tokens are persisted. Credentials and seed data are development-only.

Every JWT callback re-reads the application account. Deleted users lose authorization immediately on the next request, including requests made with previously issued JWTs; platform roles are refreshed too. Repository authorization uses database state, not client-submitted role fields.

## Data and transactions

`DATA_BACKEND=supabase` uses the server-only `DATABASE_URL` and `postgres` driver, with verified TLS, a small connection pool and prepared statements disabled for Supabase's transaction pooler. No Supabase Auth, anon keys, service-role API keys, browser database clients or browser table grants are needed. All application tables enable RLS with no browser policies. The privileged server database connection is the trust boundary: keep it out of client bundles and logs.

List mutations lock the list row before checking/editing related data. Creation of a list, owner membership and initial categories is one transaction. Reads of list details use a repeatable snapshot. Provider-identity advisory locks serialize concurrent first sign-ins. Invite acceptance locks the list then the invitation and consumes the token in the membership transaction.

`version` on lists covers list settings; item changes update list `updated_at` without incrementing its settings version. Item versions cover item editing/completion and category removal. PATCH requires `expectedVersion`; stale writes return HTTP 409 without changes. The UI retains drafts and asks users to compare the current data before adopting the new baseline.

Share tokens are random 256-bit values and only SHA-256 hashes are stored. Tokens arrive in URL fragments, then live only in tab sessionStorage during login. Invite previews disclose title/role/expiry to authenticated token holders. Acceptance is explicit, single-use and allowed for seven days. Existing accepted members retain their role. Owner/admin can revoke and list token-free invite metadata.

## Roles and deletion

- `admin`: platform-wide list management, provisioned manually by the operator.
- `owner`: list settings, deletion, categories, members and invitations.
- `editor`: list read and item changes.
- `viewer`: list read only.

All lists are private. Pending memberships confer no access. Legacy public flags are ignored/migrated to false. Member responses omit email and password/identity secrets. Account deletion cascades owned lists, memberships and identities, and nulls author/completer references on other lists.

## Abuse controls and observability

Mutation routes require a valid session, matching canonical Origin and a bounded JSON body (64 KiB). Auth starts/callbacks are rate limited to 30/minute/IP on Vercel; user buckets allow 60 writes/minute, 10 invite actions/minute and 5 account actions/minute. Production buckets use PostgreSQL atomic upsert across instances. Local mode's in-process limiter is for development only. Unknown/self-hosted proxy environments use a shared auth bucket until a trusted IP source is configured.

`/api/health` checks database/schema connectivity and returns 503 on failure. Application error logs contain event type, route template/digest or error kind, not request bodies or OAuth tokens. Hosting access logs need their own retention and access policy. Expired rate-limit records require periodic maintenance as described in deployment.md.

## Ownership transfer

Only the current owner can POST `/api/lists/:id/ownership` with `newOwnerId` and the current list `expectedVersion`. The recipient must be another accepted member of that list, including viewers. The previous owner becomes an editor. Ownership, both membership roles, the settings version and timestamp change in one transaction; competing list mutations serialize on the same list lock. Platform administration alone does not grant transfer authority. Deleting the former owner's account preserves transferred lists; lists still owned by that account retain the existing cascade-deletion behavior. The UI requires a recipient/consequence confirmation before submitting.
