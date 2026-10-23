# Compliance notes

What CitiPay stores, why, how long it is kept, and what stays simulated. Rules come from guideware/policies.js; security rules from guideware/security.md.

## Personal data

- **Mobile number.** Used as the login identity and to send the demo OTP. It is stored as a salted HMAC of the number, never in plain text.
- **Date of birth.** Used to calculate the age, to apply the minor rules and to request parental consent. Only the calculated age is kept, not the raw date.
- **Name, bio, gender and avatar.** Kept to render the profile. The avatar is re-encoded to 256 px and stripped of metadata.
- **Bank data.** Only the bank name, last four digits of the account and link status are stored. The full account number is never stored.
- **Secrets.** UPI PINs and OTPs are never stored. OTPs are compared once and discarded.

## Parental consent

- Under 18, a parent must confirm consent by OTP before any payment feature unlocks. The consent is recorded against the teen profile.
- Until consent is confirmed, minors see read-only information and cannot link banks or request payments.

## Retention

- Session data expires with the device session idle timeout and on logout.
- Payment history is kept while the account is active and is removed on request.
- OTP requests are deleted once they expire or are consumed.
- Audit logs keep a bounded record of security relevant actions and then drop old entries.

## What is simulated

- Banks, UPI and the NPCI rails are simulated. No real money moves and no real bank or UPI API is called.
- The DRUNIX ledger records simulated payments only; its signatures cover the prototype's own records.
- Push notifications are simulated. The assistant never moves money, approves payments, or reveals secrets.
