# CloudService Team 3

Dự án CloudService theo mô hình Clean Architecture + Next.js.

## Branch policy

- `main`: stable release
- `develop`: integration branch
- `feature/chien-core-landing`: architecture, core backend/frontend setup, landing page integration
- `feature/tan-admin-pricing`: admin and pricing management
- `feature/ly-orders-affiliate`: orders, affiliates, dashboard
- `feature/thinh-landing`: public landing/content screens

## Team ownership

- Chiến: core backend/frontend foundation, database, auth, shared layout, landing, final integration
- Tấn: admin, pricing, plans, promotions
- Ly: orders, affiliate, dashboard
- Thinh: landing/public content

## Project structure

```text
cloudservice-team3/
├─ .github/
│  └─ workflows/
├─ backend/
│  ├─ CloudService.sln
│  ├─ Directory.Build.props
│  ├─ src/
│  └─ tests/
├─ database/
├─ docs/
├─ frontend/
│  ├─ package.json
│  ├─ next.config.ts
│  ├─ tsconfig.json
│  ├─ eslint.config.mjs
│  └─ src/
├─ .gitignore
├─ docker-compose.yml
├─ Dockerfile.api
├─ Dockerfile.frontend
├─ README.md
└─ .env.example
```

## Local run

```bash
docker compose up --build
```

## Git workflow

1. Create branch from `develop`
2. Commit small, meaningful changes
3. Open PR into `develop`
4. Merge `develop` into `main` only after stable release

