# CitiPay Demonstration Script

Three primary end-to-end flows showcasing CitiPay's core capabilities for the DRUNIX Hackathon 2026 (NPCI x Citi).

> **Demo Mode Notice**: Append `?demo=1` to the URL to enable simulated SMS OTP delivery, bank downtime toggles, and simulated ledger controls.

---

## Flow 1: Identity Onboarding, Bank-Link & First Payment

### Objective
Demonstrate secure authentication with HMAC-salted OTP, minor/adult verification, bank account linking (last 4 digits only, zero PIN handling), and first payment on UPI rails.

### Step-by-Step Instructions
1. **Navigate to App**:
   - Open browser at `http://localhost:5173/?demo=1`.
2. **Mobile Authentication**:
   - Enter demo mobile number: `9000000001` (or click "Use Demo User 1").
   - Click **Continue**.
   - Enter 6-digit OTP displayed in the demo banner: `123456`.
   - Click **Verify**.
3. **Profile Setup**:
   - Enter Full Name: `Aarav Sharma`.
   - Select Date of Birth (e.g. `2000-01-01` for Adult or `2010-06-15` for Teen).
   - Bio: `Fintech explorer`.
   - Click **Continue to Home**.
4. **Link Bank Account**:
   - In Home dashboard or Profile tab, click **Add bank**.
   - Choose **Citi Bank** from the bank selection list.
   - Enter last 4 digits of account number: `4421`.
   - Click **Verify with bank**. The simulated UPI provider verifies the account without handling real account credentials or UPI PINs.
5. **Execute First Payment**:
   - From Quick Pay on Home or the Pay tab, select payee `Priya Sharma`.
   - Enter amount: `₹2,500`.
   - Click **Send ₹2,500 to Priya Sharma**.
   - A success toast confirms settlement, and the transaction appears in **Recent activity** with an Ed25519-signed DRUNIX block.

---

## Flow 2: Family Circle Governance & Teen Approval

### Objective
Demonstrate allowance policy enforcement, parent sign-off on transactions exceeding ₹5,000, and chore reward settlement.

### Step-by-Step Instructions
1. **Initiate High-Value Payment**:
   - From the Pay screen, select payee `Priya Sharma` or enter a custom UPI ID.
   - Enter amount exceeding the approval threshold: `₹6,000` (Policy limit is ₹5,000).
   - Click **Send**.
   - Notice the payment is not settled immediately; the status changes to **Awaiting approval** and CitiPay notifies the parent.
2. **Switch to Family Circle View**:
   - Click the **Family** tab in the curved dock.
   - Inspect the Family Circle summary showing member spending vs monthly allowance caps.
3. **Review & Approve**:
   - Under **Pending approvals**, view the pending payment request for ₹6,000.
   - Click **Approve**.
   - The status updates to `queued` -> `completed`, moving funds only upon explicit parental sign-off.
4. **Chores & Allowance Reward**:
   - Under **Chores and allowance rewards**, inspect completed teen tasks.
   - Click **Release reward** on completed chores to settle allowance earnings directly to the teen's wallet.

---

## Flow 3: Bank-Down Shield, Offline Sync & Dispute Helper

### Objective
Demonstrate resilience under core banking rail failure, offline queue persistence, and statutory refund clocks with ₹100/day delay compensation.

### Step-by-Step Instructions
1. **Simulate Bank Rail Downtime**:
   - Navigate to the **Bank** tab.
   - Click **Simulate bank down**.
   - Bank status updates to **Unavailable** in danger red.
2. **Queue Payment During Downtime**:
   - Return to **Home** or **Pay**.
   - Send `₹4,000` to a recipient.
   - Notice the payment is never dropped: CitiPay safely holds it in the local recovery queue with status `queued`.
   - Navigate to **Bank** tab to observe `Queued requests: 1`.
3. **Simulate Recovery**:
   - Click **Restore bank**.
   - The backend retry worker automatically processes the queued payment with exponential backoff and settles it exactly once with idempotency verification.
4. **Raise Regulatory Dispute**:
   - Navigate to the **Disputes** tab.
   - Under **Dispute helper**, select a settled payment and enter a reason (e.g. *Merchant terminal debited without bill receipt*).
   - Click **Raise statutory dispute**.
   - The dispute appears with an active NPCI/RBI resolution clock:
     - **T+1** for Person-to-Person transfers.
     - **T+5** for Merchant transactions.
     - Auto-compensation countdown displays: `₹100/day penalty protection`.
