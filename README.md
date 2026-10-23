# CitiPay

**Payments that explain themselves, protect the user, and share one signed record on the DRUNIX ledger.**  
Built for the **DRUNIX Hackathon 2026 (NPCI x Citi)**.

---

## Overview

CitiPay is an enterprise-grade payment and account management platform running over simulated UPI rails. It introduces family allowance governance, core banking downtime shielding, heuristic scam cooldowns, an emergency kill switch, statutory dispute refund clocks, and a tamper-evident cryptographic ledger.

### Non-Negotiable Core Rules
- **Never Hold Money**: CitiPay queues payment requests and moves money only when the bank confirms settlement.
- **Server Authority**: The Express backend re-evaluates all policies on every transaction; it never trusts client-supplied amounts, statuses, or roles.
- **Zero Sensitive Data Storage**: Never collects or handles real UPI PINs. Bank account numbers are persisted and rendered as last 4 digits only.
- **Signed Ledger**: Every state transition writes an Ed25519-signed block to the hash chain.

---

## Quick Start & Setup

### Prerequisites
- **Node.js**: v20+ (v22 recommended)
- **npm**: v10+

### Installation
```bash
# Install root, backend, and frontend dependencies
npm install
npm --prefix backend install
npm --prefix frontend install
```

### Running Locally
To launch both backend and frontend concurrently:
```bash
npm run dev
```
Or start each service independently:
```bash
# Terminal 1: Backend API (port 4000)
npm --prefix backend run dev

# Terminal 2: Frontend Vite app (port 5173)
npm --prefix frontend run dev
```

Visit `http://localhost:5173/?demo=1` to open the app with demo simulation controls enabled.

---

## Resetting Demo Data

To restore the SQLite database to its clean seeded state:
```bash
# Run seed script
node backend/src/db/seed.js
```
Pre-seeded demo accounts:
- `9000000001` (Adult - Aarav)
- `9000000002` (Parent - Vikram)
- `9000000003` (Teen - Ananya)

---

## Environment Variables

Configure environment variables in `backend/.env` (use `backend/.env.example` as a template):

| Variable | Type | Default | Description |
|---|---|---|---|
| `PORT` | Number | `4000` | Port for the Express backend server |
| `NODE_ENV` | String | `development` | Runtime environment (`development`, `production`, `test`) |
| `DEMO` | String | `1` | Enables mock SMS OTP return in responses and simulation controls |
| `JWT_SECRET` | String | *Required* | Secret key for signing session tokens (min 8 chars; placeholders rejected) |
| `JWT_EXPIRES_IN` | String | `15m` | Expiration window for access tokens |
| `FRONTEND_ORIGINS` | String | `http://localhost:5173` | Comma-separated CORS allow-list |
| `LEDGER_MODE` | Enum | `local` | `local` (Ed25519 hash chain) or `drunix` (Fabric gateway client) |
| `LLM_PROVIDER` | Enum | `none` | AI assistant provider: `none`, `anthropic`, or `openai` |
| `LLM_API_KEY` | String | `""` | Optional API key for LLM provider |
| `VAPID_PUBLIC_KEY` | String | `""` | Web Push VAPID public key |
| `VAPID_PRIVATE_KEY`| String | `""` | Web Push VAPID private key |
| `DB_CLIENT` | Enum | `sqlite` | Database engine (`sqlite` or `postgres`) |
| `DB_PATH` | String | `./data/app.db` | Local SQLite database file path |
| `DATABASE_URL` | String | `""` | PostgreSQL connection string when `DB_CLIENT=postgres` |

---

## Test & Validation Commands

```bash
# Run backend unit, integration, and security tests (27 tests)
npm --prefix backend test

# Run frontend unit and rules tests (3 tests)
npm --prefix frontend test

# Run Playwright End-to-End tests on Mobile (360px) and Desktop (1440px) (12 tests)
npm --prefix frontend exec playwright test

# Build production bundle
npm --prefix frontend run build

# Run linter
npm --prefix frontend run lint
```

---

## Docker & Container Deployment

To launch CitiPay with a dedicated PostgreSQL database:
```bash
docker-compose up --build
```
This boots:
- `postgres`: PostgreSQL 16 on port 5432 with health checks.
- `backend`: Production Node.js runner on port 4000.
- `frontend`: Production NGINX web server on port 5173 serving optimized client bundle.
