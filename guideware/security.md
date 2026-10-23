# Security rules

- Never store or log a UPI PIN or OTP.
- Never retain secrets in the repository.
- Simulation bank state must stay outside the signed DRUNIX record.
- The assistant may summarise, navigate, and prepare actions. It may never move money, approve payments, or reveal secrets.
- All thresholds and limits come from guideware/policies.js.
- Money values are whole rupees.
