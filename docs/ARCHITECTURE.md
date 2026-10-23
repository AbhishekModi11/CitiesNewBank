# CitiPay Architecture

CitiPay is a Next-Generation UPI & Ledger Payments Application built for the DRUNIX Hackathon 2026 (NPCI x Citi).

> **Core Philosophy**: Never hold customer money. CitiPay queues payment requests and moves funds only upon explicit bank confirmation, recording every state transition as a cryptographically signed, tamper-evident entry on the DRUNIX ledger.

---

## 1. System Topology & Layers

The system follows a strict unidirectional rule hierarchy:
- **`guideware/`**: Single source of truth for numeric policy thresholds, limits, compliance rules, and threat models.
- **`middleware/`**: Pure, tested JavaScript containing zero IO. Encapsulates payment state machines, heuristic scam scores, bank-down protection, and assistant guardrails.
- **`backend/`**: Express HTTP authority. Re-evaluates every incoming transaction, executes Ed25519 hash-chain signatures, and manages the retry worker.
- **`frontend/`**: React 19 + Vite client using Claymorphism and responsive design. Communicates strictly through a typed service layer.

```mermaid
graph TD
    subgraph Client ["Frontend (React 19 + Vite)"]
        UI["UI Screens & Widgets"]
        Service["Services Layer"]
        IDB["IndexedDB Offline Queue"]
        UI --> Service
        Service --> IDB
    end

    subgraph Authority ["Backend (Node.js + Express)"]
        Router["HTTP Router & Zod Validation"]
        Guard["evaluatePayment (Re-check)"]
        Worker["Exponential Backoff Retry Worker"]
        Router --> Guard
        Guard --> Worker
    end

    subgraph CoreLogic ["Middleware (Pure Logic)"]
        Rules["Rules Engine"]
        Scam["Scam Shield"]
        Radar["Balance Radar"]
        Family["Family Circle"]
    end

    subgraph Ledger ["Ledger Interface"]
        Local["LocalLedger (Ed25519 Hash-Chained)"]
        Drunix["DRUNIX Fabric Client"]
    end

    subgraph Storage ["Database Layer"]
        SQLite["SQLite (Dev) / Postgres (Prod)"]
    end

    Service -->|Idempotency-Key + CSRF| Router
    Guard --> Rules
    Rules --> Scam
    Rules --> Radar
    Rules --> Family
    Worker --> Local
    Worker --> Drunix
    Router --> SQLite
```

---

## 2. Payment Lifecycle & State Machine

Every payment starts in `draft` state and transitions deterministically through the middleware state machine:

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> AwaitingApproval: Minor / Amount > ₹5,000
    Draft --> Cooling: New Payee > ₹10,000 (60m)
    Draft --> Blocked: Risk Score ≥ 80 / Kill Switch / Insufficient Balance
    Draft --> Queued: Validated & Within Policy

    AwaitingApproval --> Queued: Parent OTP Sign-Off
    AwaitingApproval --> Declined: Parent Rejection

    Cooling --> Queued: Cooling Timer Expires
    Cooling --> Cancelled: User One-Touch Cancel

    Queued --> Processing: Bank Available & Worker Poll
    Processing --> Completed: Bank Success Confirmed
    Processing --> Queued: Bank Downtime (Auto-Retry)
    Processing --> Failed: Bank Fatal Reject

    Completed --> [*]: Recorded & Signed on DRUNIX Ledger
    Blocked --> [*]
    Declined --> [*]
    Cancelled --> [*]
    Failed --> [*]
```

---

## 3. Cryptographic Ledger & Tamper Evidence

Every transaction transition writes an Ed25519-signed block to the ledger:
- **`index`**: Incremental sequential block ID.
- **`previousHash`**: SHA-256 hash of block `n-1` (Genesis block = `"0"`).
- **`payload`**: `{ paymentId, status, amount, payee, timestamp }`.
- **`signature`**: Cryptographic Ed25519 signature of `SHA256(index + previousHash + payload)`.
- Verification endpoint `GET /ledger/verify` validates the integrity of the chain in linear time.

```mermaid
graph LR
    subgraph Block_0 ["Genesis Block 0"]
        H0["Hash: 0x8a..."]
        P0["Payload: Init"]
    end

    subgraph Block_1 ["Block 1 (Queued)"]
        H1["Prev: 0x8a... | Hash: 0x3b..."]
        P1["Payload: ₹6,000 to Bob"]
        S1["Sign: Ed25519(Node.crypto)"]
    end

    subgraph Block_2 ["Block 2 (Settled)"]
        H2["Prev: 0x3b... | Hash: 0x9f..."]
        P2["Payload: Settled by Bank"]
        S2["Sign: Ed25519(Node.crypto)"]
    end

    Block_0 --> Block_1
    Block_1 --> Block_2
```

---

## 4. Guarded Assistant Architecture

The assistant operates strictly through read-only tools and hard policy guardrails defined in `guideware/ai-policy.js` and `middleware/assistant-guardrails.js`.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Assistant as Guarded Assistant UI
    participant Guardrails as Middleware Intent Classifier
    participant LLM as Server LLM / Rule Pipeline
    participant Ledger as Read-Only System State

    User->>Assistant: "Send ₹500 to Bob"
    Assistant->>Guardrails: classifyAssistantIntent("Send ₹500 to Bob")
    Note over Guardrails: Detects money movement violation
    Guardrails-->>Assistant: Refusal: "I cannot move money, approve payments, or reveal secrets."
    Assistant-->>User: Refusal display

    User->>Assistant: "What is my tracked payments status?"
    Assistant->>Guardrails: classifyAssistantIntent("What is my tracked payments status?")
    Note over Guardrails: Intent: track_payment (Allowed)
    Guardrails->>Ledger: Query read-only payment count & statuses
    Ledger-->>Guardrails: { active: 1, settled: 3 }
    Guardrails-->>Assistant: Formatted safe status response
    Assistant-->>User: Displays status summary
```

---

## 5. Security & Threat Mitigation Summary

| Threat (STRIDE) | Countermeasure |
|---|---|
| **Spoofing** | Salted HMAC mobile authentication, constant-time OTP comparison, 5-attempt lockout, single-use tokens. |
| **Tampering** | Server-side `evaluatePayment` re-evaluation; client never dictates amounts, statuses, or limits. |
| **Repudiation** | Ed25519 signed ledger entries and audit logging for approvals, cancellations, and mandate toggles. |
| **Information Disclosure** | Never store full bank account numbers (masked to last 4 digits); zero collection of UPI PINs; strict log redaction via Pino. |
| **Denial of Service** | Bounded offline queue with IndexedDB idempotency; strict Express rate-limiting (300 req/min). |
| **Elevation of Privilege** | Guardianship OTP gate enforces minor status (<18) before linking bank accounts or sending funds. |
