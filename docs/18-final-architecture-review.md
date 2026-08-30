# Final architecture review — CloudService (28/08/2026)

## Executive verdict

The repository now has a credible Clean Architecture baseline and a reproducible release gate. It is not honest to promise a 9.5 score or “production ready” solely from source code: deployment secrets, Docker runtime evidence, real load-test output, branch/PR history and the final report/slides still need to be supplied by the team. The release gate below makes those claims verifiable instead of cosmetic.

## Evidence-first scope check

- The assignment PDF describes a four-layer ASP.NET Core solution, SQL Server/EF Core, REST/ProblemDetails, JWT + refresh token, RBAC, responsive frontend, tests, GitHub Actions and Docker Compose. The PDF text mentions .NET 8/9; this implementation deliberately targets the installed .NET 10 SDK (`global.json` and all backend projects target `net10.0`) because that is the team's explicit submission constraint.
- Lecture principles are reflected in the boundaries: controllers translate HTTP only; Application owns use cases and validation; Domain owns invariants; Infrastructure owns EF/SQL, JWT, Telegram, SMTP and background workers. DTOs are separate from entities, and write requests use idempotency and concurrency tokens.
- The user-requested `team-cloud-starter-v2/docs` directory does not exist in this checkout. The available source of truth is `CloudService/docs`; this discrepancy must be resolved before submission rather than silently presented as evidence.

## Four-member work split

`docs/01-phan-cong-va-quy-dinh.md` defines four coherent streams with explicit boundaries and acceptance criteria:

1. TV1 — architecture, database, authentication/RBAC, shared layout, pricing/recommendation, CI and Docker.
2. TV2 — service catalogue, prices, promotions and QR lifecycle.
3. Package A — order intake, affiliate attribution, dashboard, export and audit-facing operations.
4. Package B — public landing, blog/content, testimonials, Q&A and contact.

The split is logically connected through shared DTOs and database contracts. It is not yet evidence of individual contribution: `docs/10-team-contribution-template.md` is intentionally a template. Fill it with actual commits, PRs, reviewers and screenshots; never invent those records.

## High-risk findings addressed

| Risk | Current control | Remaining boundary |
|---|---|---|
| Quote/order race | HMAC quote token; backend recalculates inside the order transaction and returns 409 on stale/tampered token | Distributed pricing cache is not required; price source remains SQL Server |
| Duplicate POST | SQL idempotency record plus request hash and replayed response | Validate retention/cleanup policy in production |
| Refresh-token replay | Rotation, rowversion concurrency, revoke-on-logout and access-token JTI blocklist | `MemoryAccessTokenRevocationStore` is process-local; use Redis for multiple API replicas |
| Affiliate spoofing/race | Signed server proof in HttpOnly cookie, proof/code/visit cross-check, rate limit, unique VisitId convergence and conversion validation | Add IP/device fraud scoring and a review queue before paying commissions |
| Synchronous Excel bottleneck | `202 Accepted` export job, durable status/download endpoints and leased background worker | Job fails explicitly above 5,000 rows (sentinel query; no silent truncation); move binary content/streaming to S3/MinIO for very large tenants |
| State corruption | Domain order state machine rejects illegal transitions; rowversion on mutable aggregates | Add contract tests for every admin workflow in E2E |
| Audit gaps | EF interceptor captures catalog snapshots; feature services write domain actions; audit retention worker exists | Verify retention/legal policy with the lecturer; do not purge regulated records blindly |

## Test and release commands

```powershell
dotnet restore backend/CloudService.sln
dotnet build backend/CloudService.sln -c Release --no-restore
dotnet test backend/CloudService.sln -c Release --no-build --collect:"XPlat Code Coverage" --settings backend/coverage.runsettings
cd frontend
npm ci
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build
```

The checked local run produced 29 Domain tests, 37 Application tests and one opt-in integration smoke test (67 total). The integration test starts a pinned SQL Server Testcontainer only when `RUN_INTEGRATION_TESTS=true`; otherwise it exits without touching a developer database. CI enables the flag.

The new `.github/workflows/main.yml` performs restore/build/test/coverage, SQL Server Testcontainers, frontend lint/typecheck/Jest/build, Docker Compose readiness and Playwright recording upload. `scripts/load/k6-orders.js` and `docs/load-test-report.md` provide a repeatable load profile; no latency result is claimed until a real artifact is attached.

## Local Docker acceptance

```powershell
docker compose config
docker compose up -d --build
curl http://localhost:8080/health/ready
curl http://localhost:3000/
```

Compose maps SQL Server to host port `14330`, API to `8080` and Next.js to `3000`. Local demo seed credentials are deliberately development-only. Before a shared deployment, replace the SQL/JWT/demo values, disable demo seed/reset, set `SESSION_COOKIE_SECURE=true` behind HTTPS, configure an allow-list CORS origin, and provide Telegram/SMTP secrets through the deployment secret store. Telegram IDs and the bot token are not committed here.

## Deployment compatibility verdict

The repository also contains `docker-compose.prod.yml` and `nginx/nginx.conf`. This profile is suitable for a local/server hand-off smoke test, but its bundled Nginx is HTTP-only: keep `SESSION_COOKIE_SECURE=false` for `http://localhost`; terminate TLS and set it to `true` before exposing the service publicly. A VPS/VM running the complete Compose stack is the closest parity with local because SQL, background workers, and upload volumes stay together.

The Vercel + Render + Azure SQL alternative is a demo deployment, not a 100% production-equivalent path. Render Free web services can sleep and have ephemeral filesystems, so uploaded avatars/branding/plan images can disappear after restart; move uploads to S3/MinIO/Azure Blob or use paid persistent storage. Render environment variables must use ASP.NET nested names such as `Telegram__BotToken`, `Telegram__ChatId`, `PublicBaseUrl` and `Cors__AllowedOrigins__0`. Vercel must set `Root Directory=frontend`, `NEXT_PUBLIC_API_BASE_URL` and server-side `BACKEND_API_BASE_URL`, then pass a real HTTPS/CORS/health smoke test before claiming the deployment is complete.

## Score guidance (evidence required)

Architecturally this is in the high-A range, but the final numeric mark depends on evidence outside code: the lecturer's requested PDF/slides, real GitHub PR history, a green Actions run, Docker Compose run, Playwright artifacts and measured k6 output. Any evaluator claiming those without artifacts is guessing.
