# CitiPay Project Status & Requirements Traceability

This document records the exact compliance and implementation status of all CitiPay product, architectural, security, and feature requirements across Milestones M1 through M4 and Final Deliverables.

## Audit & Step 0 (Completed)
| Requirement | Status | File Path(s) | Notes |
|-------------|--------|--------------|-------|
| Export `assistantReply` from middleware | Done | `middleware/assistant-guardrails.js`, `middleware/index.js` | Exported and integrated with assistant service |
| Add `middleware/package.json` with type module | Done | `middleware/package.json` | Configured as ES module |
| Add `guideware/package.json` with type module | Done | `guideware/package.json` | Configured as ES module |
| Create `backend/.env.example` with required vars | Done | `backend/.env.example` | Covers PORT, NODE_ENV, DEMO, JWT_SECRET, etc. |
| `.gitignore` covers `.env`, `data/`, `*.db` | Done | `.gitignore` | Configured correctly |
| Smoke test that boots backend | Done | `backend/tests/smoke.test.js` | Boots in-memory database and tests `/health` |
| Add `GET /health` and `GET /ready` | Done | `backend/src/app.js` | Both endpoints operational |

---

## Milestone 1: Frontend and Middleware (Completed)
| Requirement | Status | File Path(s) | Notes |
|-------------|--------|--------------|-------|
| Rename generic files to domain-role kebab-case | Done | `frontend/src/screens/*` | All screens follow domain-role kebab-case (no App/main/utils/mock) |
| Pay flow with recipient selection and UPI address | Done | `frontend/src/screens/payments/pay-flow-screen.jsx`, `frontend/src/flows/quick-pay-flow.jsx` | Tested in Playwright and vitest |
| Where is my money timeline & payment tracker | Done | `frontend/src/screens/payments/payment-tracker-screen.jsx`, `middleware/payment-tracker.js` | Real-time state visualization with DRUNIX signed entries |
| Bank-down shield UI & queue indicator | Done | `frontend/src/screens/bank/bank-shield-screen.jsx`, `middleware/bank-shield.js` | Toggle and queue visualizer functioning |
| Autopay & EMI accept/decline pop-up | Done | `frontend/src/screens/autopay/autopay-guard-screen.jsx`, `middleware/autopay-guard.js` | Buffer checks and mandate risk alerts |
| Scam-shield cooling screen with cancel | Done | `frontend/src/screens/scam/scam-cooling-screen.jsx`, `middleware/scam-shield.js` | 60-min cooling delay for new payees > ₹10,000 with cancel |
| Emergency Kill Switch | Done | `frontend/src/screens/safety/kill-switch-screen.jsx`, `middleware/kill-switch.js` | One-touch pause, confirmed in E2E tests |
| Family Circle (Adult, Parent, Teen views) | Done | `frontend/src/screens/family/family-circle-screen.jsx`, `middleware/family-circle.js` | Roles, allowance caps, chore rewards, parent approvals |
| Disputes with statutory refund clock | Done | `frontend/src/screens/disputes/disputes-refund-screen.jsx`, `middleware/dispute-clock.js` | T+1 person-to-person, T+5 merchant with ₹100/day auto compensation |
| Balance radar & cash flow forecasting | Done | `frontend/src/screens/radar/balance-radar-screen.jsx`, `middleware/balance-radar.js` | 30-day forecast with low balance alerts |
| Guarded rule-based assistant | Done | `frontend/src/screens/assistant/assistant-guard-screen.jsx`, `middleware/assistant-guardrails.js` | Refuses money movement, approval, and PIN/OTP disclosure |

---

## Milestone 2: Backend, Ledger, Chaincode (Completed)
| Requirement | Status | File Path(s) | Notes |
|-------------|--------|--------------|-------|
| SQLite repository layer (PostgreSQL-ready) | Done | `backend/src/db/sqlite.js`, `backend/src/db/repos/*` | Clean SQL parameterization, schema migrations, and seeds |
| JWT roles, Zod validation, Helmet, CORS, Rate limiting | Done | `backend/src/app.js`, `backend/src/http/auth.js` | Full security pipeline with role guards and CSRF checks |
| Payments with Idempotency-Key & state machine | Done | `backend/src/modules/payments/*`, `middleware/payment-state-machine.js` | Strictly rejects duplicate execution |
| BankProvider & UPIProvider mocks with demo toggle | Done | `backend/src/integrations/bank/mockBank.js` | Demo controls gated behind `config.demo` |
| Retry worker with exponential backoff | Done | `backend/src/jobs/retryWorker.js` | Automatic recovery of queued bank payments |
| Local hash-chained signed ledger | Done | `backend/src/integrations/ledger/local.js`, `backend/src/db/repos/ledger.js` | SHA-256 hash chaining, tamper detection, verification |
| DRUNIX Fabric Gateway ledger client | Done | `backend/src/integrations/ledger/drunix.js` | Gateway adapter configurable via LEDGER_MODE |
| Chaincode contracts (AllowanceRules, Approvals, PaymentStatus, Chores) | Done | `chaincode/index.js`, `backend/tests/chaincode.test.js` | Hyperledger Fabric contract suite tested and passing |
| Web Push notifications with VAPID | Done | `backend/src/modules/notifications/` | Push notification management |
| Assistant pipeline with read-only tools and redacting output filter | Done | `backend/src/modules/assistant/` | Sensitive data masking and strict prompt gating |

---

## Milestone 3: Hardening (Completed)
| Requirement | Status | File Path(s) | Notes |
|-------------|--------|--------------|-------|
| HttpOnly, Secure, SameSite cookies + CSRF protection | Done | `backend/src/modules/auth/auth.routes.js`, `backend/src/app.js` | Enforced on state-changing operations |
| Token refresh rotation & lockout after 5 failures | Done | `backend/src/modules/auth/lockout.js` | 5 attempts lockout for 15 minutes |
| Single-use expiring approvals | Done | `backend/src/modules/payments/payments.service.js` | 5-minute approval expiration and replay prevention |
| Strict Content Security Policy (CSP) | Done | `backend/src/app.js` | Helmet CSP directives configured |
| Environment variable validation | Done | `backend/src/config.js` | Zod validation on boot; placeholder secrets rejected |
| PWA manifest & service worker offline cache | Done | `frontend/public/manifest.webmanifest`, `frontend/public/sw.js` | App shell cached for offline access |
| IndexedDB offline payment queue with ordered sync | Done | `frontend/src/services/offlineQueue.js` | Offline transactions queued, synced, and settled when online |
| Accessible theme palette (Light, Dark, High-contrast) | Done | `frontend/src/styles/tokens.css`, `frontend/src/screens/profile/profile-view-screen.jsx` | Full token palette from AGENTS.md with persistence |
| Dockerfiles and docker-compose with Postgres | Done | `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml` | Multi-stage Docker builds and compose environment |
| GitHub Actions CI, Dependabot, SBOM | Done | `.github/workflows/ci.yml`, `.github/dependabot.yml` | Lint, tests, build, npm audit, CodeQL, gitleaks, Trivy, SBOM |
| Assistant red-team security tests | Done | `frontend/tests/e2e/flows.spec.js`, `backend/tests/security.test.js` | Validated: strictly refuses to move money or disclose secrets |
| Threat Model (STRIDE) & Compliance docs | Done | `guideware/threat-model.md`, `guideware/compliance.md` | Comprehensive security and regulatory documentation |

---

## Milestone 4: Identity, Onboarding, Home Experience (Completed)
| Requirement | Status | File Path(s) | Notes |
|-------------|--------|--------------|-------|
| Mobile + OTP login (HMAC, constant-time compare, rate limits) | Done | `backend/src/modules/auth/auth.routes.js`, `frontend/src/screens/auth/` | Tested and validated via vitest & Playwright |
| Profile setup with age calculation & guardian OTP for minors | Done | `frontend/src/screens/profile/profile-setup-screen.jsx`, `profile-view-screen.jsx` | Enforces minor protection under 18 |
| Avatar upload with magic-byte check & 256px webp resize | Done | `backend/src/modules/profile/profile.routes.js` | Sharp + Busboy pipeline with MIME check |
| Bank-link sheet (primary account, account removal guard) | Done | `frontend/src/flows/bank-link-sheet.jsx` | Simulated bank verification; blocks removal on pending payments |
| Home widget grid (1, 2, 3 column responsive) | Done | `frontend/src/screens/home/home-widget-board.jsx` | 10 modular widgets responsive across mobile, tablet, desktop |
| QR Code generation with expiry and rotation | Done | `frontend/src/screens/home/receive-qr-widget.jsx`, `backend/src/modules/qr/` | Amount QRs expire in 15 minutes; supports rotation, share, download |
| Curved clay tab dock with directional sliding animation | Done | `frontend/src/shell/curved-tab-dock.jsx`, `frontend/src/shell/tab-transition-stage.jsx` | 320ms direction-aware slide, 120ms crossfade on reduced motion |
| Assistant hero bar & floating bottom dock | Done | `frontend/src/shell/assistant-hero-bar.jsx`, `assistant-bottom-dock.jsx`, `assistant-panel.jsx` | Hero bar on Home and docked bottom bar opening assistant panel |
| Money-rain backdrop animation | Done | `frontend/src/shell/money-rain-backdrop.jsx` | Floating currency symbols; paused on hidden, static on reduced motion |

---

## Final Deliverables & Test Verification (Completed)
| Verification Check | Target | Actual Result | Status |
|--------------------|--------|---------------|--------|
| Backend Vitest Test Suite | 27 tests | **27/27 passed** | PASSED |
| Frontend Vitest Test Suite | 3 tests | **3/3 passed** | PASSED |
| Playwright E2E Suite (Mobile 360px & Desktop 1440px) | 12 tests | **12/12 passed** | PASSED |
| Frontend Production Build (Vite) | Zero errors | **Success in ~800ms** | PASSED |
| Linter (Oxlint) | Zero errors | **0 errors** | PASSED |
| Documentation | Architecture, Demo, Readme | Complete with Mermaid & Setup | PASSED |
