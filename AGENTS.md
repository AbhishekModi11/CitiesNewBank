# CitiPay

Payments app for the DRUNIX Hackathon 2026 (NPCI x Citi). Payments that explain themselves, protect the user, and share one signed record on the DRUNIX ledger.

## Product rules
- Never hold money. Queue payment requests and move money only when the bank confirms.
- Runs on UPI rails. Banks and UPI are simulated in the prototype.
- Core features: payment tracker, bank-down shield, autopay and EMI guard, scam shield, kill switch, Family Circle, guarded assistant, dispute helper, balance radar.

## Architecture
See repository layout. `guideware/` is the single source of truth for limits and policy. `middleware/` is pure logic. `frontend/` calls middleware through `frontend/src/services`.

## Backend rules (Phase 2)
- The server is the authority. Re-run evaluatePayment on the server for every payment. Never trust the client.
- Express layer lives in backend/src/http (auth, roles, validation, errors). The top-level middleware/ folder is shared logic only.
- Every route validates input with Zod and checks role. Parameterised SQL only.
- Config from environment variables. Keep .env.example complete and never commit .env.
- The ledger sits behind one interface with two implementations: local (hash-chained, tamper-evident) and DRUNIX. LEDGER_MODE selects which.
- LLM calls happen only on the server, through the guardrails. The assistant has read-only tools and can never move money, approve, change rules, or see PINs or OTPs.
- Never log PINs, OTPs, tokens, or passwords. Redact them in logs.

## Hardening rules (Phase 3)
- Security first: when a task conflicts with a guardrail in guideware/, keep the guardrail.
- Tokens live in httpOnly, Secure, SameSite cookies with CSRF protection. Nothing sensitive in localStorage.
- Validate all environment variables at startup with Zod and refuse to start if a secret is missing or still a placeholder.
- Every ledger entry is signed (Ed25519 through Node crypto). Approvals are single-use and expire.
- Database access only through the repository layer. SQLite for development, PostgreSQL for production, selected by DB_CLIENT.
- Do not claim certifications, and do not handle real UPI PINs. Bank and UPI access stays behind provider interfaces.
- Themes use tokens only. Dark and high-contrast values come from AGENTS.md colours.
- UI content rules still apply: no versions, build info, tips or filler text.

## Brand and colour (used on every screen, tokens only, never hard-coded hex)
| Role | Light value |
|---|---|
| Canvas gradient | #EAF3FF, #F7FBFF, #FFF3E6 |
| Clay surface | #F1F6FF |
| Clay shadow dark / light | rgba(30,74,140,0.26) / rgba(255,255,255,0.96) |
| Ink / muted | #0F2347 / #5B6B8C |
| Navy (DRUNIX and NPCI) | #0B2A5B |
| Primary (Citi-inspired blue) | #0A6EC9, bright end #2FA4FF |
| Accent (DRUNIX orange, highlights only) | #FF8A1F, text on it is navy |
| Success: fill / text / bg | #12A07A / #0B6B51 / #D9F5EC |
| Warning: fill / text / bg | #E8A317 / #7A5200 / #FFF3D1 |
| Danger (Citi-red-inspired): fill / text / bg | #E4372D / #A81F17 / #FFE2DF |
| Info: fill / bg | #2F8CFF / #DCEBFF |
| Family Circle | #0FA3A3 |
Dark theme: background #07142B, surface #10223F, ink #E8F0FF, muted #9FB2D6, primary #4DA3FF, accent #FFA64D.
Primary buttons use a blue gradient. Orange is only for highlights: active tab glow, notification dot, QR frame, assistant spark. Widget accents: Quick pay primary, Family teal, Disputes warning, Tracker info, Receive success, Safety danger, Balance navy.

## Naming and originality
- File names are domain plus role in kebab-case (example: otp-verify-screen.jsx, retry-worker.job.js). Never use generic names such as App, main, index (except barrels), utils, helpers, common, data or mock.
- Write original code for this project. Do not paste code from templates or tutorials. Allowed new dependencies: qrcode.react; dev only: vitest, playwright. Pin exact versions and commit the lockfile.

## Identity, onboarding and home rules
- Login is mobile number plus OTP only. OTPs are 6 digits, stored as salted HMAC, compared in constant time, single-use, expiring, rate-limited per number and per IP, never logged, and never returned by the API outside demo mode. The responses for new and existing numbers are identical.
- Flow gates: mobile number, OTP, profile (new users), home. No screen can be reached without finishing the one before it.
- Age comes from date of birth. Under 18 needs a parent who confirms by OTP before any payment feature unlocks.
- Never store a full account number, UPI PIN, or card data. Store bank, last four digits, and link status only.
- Paying with no linked bank opens the bank-link flow first, then returns to the payment.
- A QR carries only the payment address and display name. Amount QRs expire.
- Home is a grid of widgets from one widget component and one layout config in guideware/policies.js.
- All numbers live in guideware/policies.js.

## Navigation, motion and assistant rules
- Five tabs: Home, History, Assistant (centre, raised), Balance check, Profile. Curved clay dock at the bottom on mobile and a curved rail on desktop. aria-current on the active tab.
- Tab change animation is direction-aware: higher tab index slides in from the right, lower from the left, 320 ms. The active indicator glides with a slight overshoot and stretches on long jumps (Home to Profile). The active icon lifts and its label appears. Reduced motion means a 120 ms crossfade only.
- Assistant has a bar in the middle of Home and a docked bar at the bottom. Both open one panel: bottom sheet on mobile, side panel on desktop. The dock hides on the Assistant tab.
- Background: slowly floating money symbols, mostly the rupee sign, with some $, euro and pound at low opacity. Transforms and opacity only, fewer symbols on mobile, paused when the page is hidden, static when reduced motion is on.