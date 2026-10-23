import { useState } from 'react'
import { Landmark, ShieldCheck, Moon, Sun, Eye, Plus, Trash2 } from 'lucide-react'
import { formatRupees } from '../../lib/money.js'

export default function ProfileViewScreen({
  accounts = [],
  onOpenBankLink,
  onSetPrimary,
  onRemoveBank,
  theme,
  setTheme,
}) {
  const [profile] = useState({
    name: 'CitiPay Member',
    mobile: '+91 90000 00001',
    dob: '1995-06-15',
    gender: 'Prefer not to say',
    bio: 'CitiPay user on DRUNIX ledger rails',
  })

  // Calculate age from DOB
  const calculateAge = (dobString) => {
    if (!dobString) return 30
    const birth = new Date(dobString)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  const age = calculateAge(profile.dob)
  const isMinor = age < 18

  return (
    <div className="col">
      <section className="clay card" aria-label="Profile">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              className="clay-sm round"
              style={{
                width: 56,
                height: 56,
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-bright))',
                color: '#fff',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {profile.name[0]}
            </div>
            <div>
              <h3 style={{ margin: 0 }}>{profile.name}</h3>
              <p className="muted small">{profile.mobile} · Age {age}</p>
            </div>
          </div>
          <span className="status settled" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ShieldCheck size={14} /> {isMinor ? 'Minor (Guardian linked)' : 'Verified adult'}
          </span>
        </div>

        <div className="clay-sm" style={{ padding: 12, marginBottom: 14 }}>
          <div className="muted small">Bio</div>
          <p style={{ marginTop: 4 }}>{profile.bio}</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
          <div>
            <strong>Appearance theme</strong>
            <p className="muted small">Saved to local device preferences</p>
          </div>
          <div className="chips">
            <button
              className={`chip clay-sm ${theme === 'light' ? 'on' : ''}`}
              onClick={() => setTheme('light')}
            >
              <Sun size={14} /> Light
            </button>
            <button
              className={`chip clay-sm ${theme === 'dark' ? 'on' : ''}`}
              onClick={() => setTheme('dark')}
            >
              <Moon size={14} /> Dark
            </button>
            <button
              className={`chip clay-sm ${theme === 'high-contrast' ? 'on' : ''}`}
              onClick={() => setTheme('high-contrast')}
            >
              <Eye size={14} /> Contrast
            </button>
          </div>
        </div>
      </section>

      <section className="clay card" aria-label="Linked bank accounts">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Landmark size={20} color="#0A6EC9" />
            <h3>Linked bank accounts</h3>
          </div>
          <button className="clay-btn sm primary" onClick={onOpenBankLink}>
            <Plus size={14} /> Add bank
          </button>
        </div>

        <p className="muted small">
          Only last 4 digits stored. Never stores UPI PIN or full card data.
        </p>

        <ul className="list" style={{ marginTop: 12 }}>
          {accounts.map((a) => (
            <li key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{a.bank} •••• {a.last4}</strong>
                <small>{formatRupees(a.balance)}{a.isPrimary ? ' · Primary account' : ''}</small>
              </div>
              <div className="row">
                {!a.isPrimary && onSetPrimary && (
                  <button className="clay-btn sm" onClick={() => onSetPrimary(a.id)}>Set primary</button>
                )}
                {accounts.length > 1 && onRemoveBank && (
                  <button className="clay-btn sm" onClick={() => onRemoveBank(a.id)} aria-label="Remove bank">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
