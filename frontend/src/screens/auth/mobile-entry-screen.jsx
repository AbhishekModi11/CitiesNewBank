export default function MobileEntryScreen({ mobile, setMobile, error, onContinue }) {
  return (
    <section className="clay card" aria-label="Mobile entry" style={{ maxWidth: 420, margin: '80px auto' }}>
      <h3>Enter your mobile number</h3>
      <p className="muted small">We will send a 6 digit OTP to +91 {mobile || 'xxxxxxxxxx'}</p>
      <input
        className="field clay-in"
        inputMode="numeric"
        maxLength={10}
        value={mobile}
        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
        aria-label="Mobile number"
        style={{ width: '100%' }}
      />
      {error && <p className="err">{error}</p>}
      <button
        className="clay-btn primary grow"
        style={{ marginTop: 12, width: '100%' }}
        onClick={onContinue}
      >
        Continue
      </button>
    </section>
  )
}
