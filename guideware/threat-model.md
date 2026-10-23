# Threat model

STRIDE review covers mobile login, payments, approvals, ledger, assistant and uploads. All limits and rules live in guideware/policies.js; this file records the threats we defend against and the mitigations in place.

## Spoofing

| Threat | Mitigation |
| --- | --- |
| Someone logs in as a demo user from another device | Login requires a fresh OTP; each login creates a new device session, and old sessions stop working after the idle timeout (see device_sessions). |
| Someone replays a stolen session token | Access tokens expire, are refreshed with rotation, and a replayed refresh token revokes the session that used it. |
| Someone guesses or brute forces an OTP | Verification is rate limited per mobile number, five attempts trigger a lockout, and the comparison is constant time. |
| Someone forges a session cookie | Session cookies are httpOnly, Secure and SameSite; tokens are signed with the server secret. |

## Tampering

| Threat | Mitigation |
| --- | --- |
| A payment request is tampered with before it reaches the server | The server re-evaluates every payment; the client only sends a draft and never decides the outcome. |
| Ledger entries are edited after the fact | Ledger entries are hash chained and signed (Ed25519). Any edit breaks the chain and is reported by /ledger/verify. |
| Bank or ledger state diverges from the payment record | The server owns balances and bank availability; clients receive read-only snapshots. |
| Profile data is edited without authorisation | Profile routes require an authenticated session. |

## Repudiation

| Threat | Mitigation |
| --- | --- |
| A user denies approving or cancelling a payment | Every state change is written to the payment event history and to the audit log. |
| A guardian confirms consent without the parent | Guardian confirmation requires the parent's own mobile and an OTP; the consent is recorded against the teen. |

## Information disclosure

| Threat | Mitigation |
| --- | --- |
| OTPs or PINs reach the client or the logs | OTPs are compared server side only, never logged, and only returned in demo mode. Bank verification never sees a PIN. |
| Secrets reach the assistant | The assistant guardrails block any request that asks for secrets, money movement, or approvals. |
| Uploads reveal more than intended | Avatars are validated by type and size, re-encoded to 256 px, and stripped of metadata. |
| Full account numbers are exposed | Only the last four digits are stored or returned. |

## Denial of service

| Threat | Mitigation |
| --- | --- |
| A number floods OTP requests | OTP requests are limited per number per hour. |
| A client opens many sessions | Device sessions expire on idle timeout and are revoked on logout. |
| A bank is repeatedly unavailable | The offline queue has a bounded capacity; payments queue instead of failing. |

## Elevation of privilege

| Threat | Mitigation |
| --- | --- |
| A teen reaches payment features without a confirmed guardian | Profiles of minors stay locked until the guardian confirms. |
| A user removes the last bank account with pending payments | Account removal is blocked while payments are pending or an active mandate exists. |
| A user acts on behalf of another user | Every route checks the session's user id; records are scoped by that id. |
