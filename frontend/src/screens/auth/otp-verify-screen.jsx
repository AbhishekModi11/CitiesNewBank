export default function OtpVerifyScreen({ mobile, otp, setOtp, error, onBack, onVerify }) {
  return (
    <section className="clay card" aria-label="Verification form" style={{ maxWidth: 420, margin: '80px auto' }}>
      <h3>Verify OTP</h3>
      <p className="muted small">Sent to +91 {mobile}</p>
      <input
        className="field clay-in"
        inputMode="numeric"
        maxLength={6}
        value={otp}
        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
        aria-label="OTP"
        style={{ width: '100%', textAlign: 'center', fontSize: 24 }}
      />
      {error && <p className="err">{error}</p>}
      <div className="row" style={{ marginTop: 12 }}>
        <button className="clay-btn grow" onClick={onBack}>Back</button>
        <button className="clay-btn primary grow" onClick={onVerify}>Verify</button>
      </div>
    </section>
  )
}
