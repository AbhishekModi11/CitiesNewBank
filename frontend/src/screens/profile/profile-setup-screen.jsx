import { useState } from 'react'

export default function ProfileSetupScreen({ name, setName, dob, setDob, bio, setBio, error, onSave }) {
  const [gender, setGender] = useState('prefer_not_to_say')

  return (
    <section className="clay card" aria-label="Profile setup" style={{ maxWidth: 420, margin: '80px auto' }}>
      <h3>Set up your profile</h3>
      <input
        className="field clay-in"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Full name"
        aria-label="Full name"
        style={{ width: '100%', marginBottom: 8 }}
      />
      <input
        className="field clay-in"
        type="date"
        value={dob}
        onChange={(e) => setDob(e.target.value)}
        aria-label="Date of birth"
        style={{ width: '100%', marginBottom: 8 }}
      />
      <select
        className="field clay-in"
        value={gender}
        onChange={(e) => setGender(e.target.value)}
        aria-label="Gender"
        style={{ width: '100%', marginBottom: 8 }}
      >
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="prefer_not_to_say">Prefer not to say</option>
      </select>
      <textarea
        className="field clay-in"
        value={bio}
        onChange={(e) => setBio(e.target.value.slice(0, 120))}
        placeholder="Short bio"
        aria-label="Short bio"
        style={{ width: '100%', minHeight: 80 }}
      />
      <div className="muted small">{120 - bio.length} characters left</div>
      {error && <p className="err">{error}</p>}
      <button
        className="clay-btn primary grow"
        style={{ marginTop: 12, width: '100%' }}
        onClick={onSave}
      >
        Continue to Home
      </button>
    </section>
  )
}
