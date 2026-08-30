# Load-test evidence

This file is a reproducible report template, not fabricated benchmark output. Run it against an isolated deployment and paste the generated summary below.

```powershell
k6 run -e BASE_URL=http://localhost:8080 scripts/load/k6-orders.js
```

The scenario ramps to 500 virtual users and exercises the public plan catalogue. It keeps order creation disabled by default so a demo database is not polluted. To measure the write path, use a disposable database and explicitly set `RUN_ORDER_WRITE=true`.

## Release gate

- Error rate: `< 1%`
- P95 latency: `< 500 ms` for the default local gate; a production SLO of `< 200 ms` must be demonstrated on the actual deployment hardware.
- No unbounded query or synchronous file export in the measured endpoints.

## Run metadata

| Field | Value |
|---|---|
| Date/time (UTC) | _fill after run_ |
| Commit SHA | _fill after run_ |
| Base URL | _fill after run_ |
| Database tier | _fill after run_ |
| VUs / duration | 500 peak / 2m |
| Result artifact | _attach k6 JSON/HTML output_ |

Never claim the thresholds passed until the artifact is attached from a real run.
