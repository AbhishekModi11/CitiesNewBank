import { Power, ShieldAlert } from 'lucide-react'

export default function KillSwitchScreen({ killSwitch, onToggle }) {
  return (
    <div className="col">
      <section className="clay card" aria-label="Kill switch">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Power size={24} color={killSwitch.active ? '#E4372D' : '#12A07A'} />
          <h3>Emergency kill switch</h3>
        </div>
        <p className={killSwitch.active ? 'err' : 'pos'} style={{ fontWeight: 600 }}>
          {killSwitch.active ? 'Payments paused' : 'Payments active'}
        </p>
        <p className="muted small">
          Instantly pauses all outgoing payment rails across linked banks and UPI IDs.
        </p>
        {killSwitch.active && killSwitch.lockedUntil && (
          <p className="muted small" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldAlert size={14} color="#E8A317" />
            Locked until {new Date(killSwitch.lockedUntil).toLocaleTimeString()}
          </p>
        )}
        <button
          className={`clay-btn grow ${killSwitch.active ? 'primary' : 'danger-btn'}`}
          style={{
            marginTop: 12,
            background: killSwitch.active ? undefined : 'linear-gradient(135deg, #E4372D, #FF5C52)',
            color: '#fff',
            fontWeight: 700,
          }}
          onClick={onToggle}
        >
          {killSwitch.active ? 'Resume payments' : 'Pause all payments'}
        </button>
        <p className="muted small" style={{ marginTop: 8 }}>
          {killSwitch.active
            ? 'Safe mode enabled. Click to resume normal transaction processing.'
            : 'All new payment requests are strictly rejected while paused.'}
        </p>
      </section>
    </div>
  )
}
