import { isDemoMode } from '../../services/demo.js'
import { formatRupees } from '../../lib/money.js'
import { Shield, ShieldAlert, ArrowRightCircle } from 'lucide-react'

export default function BankShieldScreen({ bankUp, onToggleBank, payments, onProcess, onTimeSkip }) {
  const queued = payments.filter((p) => p.status === 'queued' || p.status === 'cooling')
  const demo = isDemoMode()

  return (
    <div className="col">
      <section className="clay card" aria-label="Bank status">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          {bankUp ? <Shield size={24} color="#12A07A" /> : <ShieldAlert size={24} color="#E4372D" />}
          <h3>Bank shield</h3>
        </div>
        <p className={bankUp ? 'pos' : 'err'}>{bankUp ? 'Available' : 'Unavailable'}</p>
        <p className="muted small">
          {bankUp
            ? 'Core banking rails operational. Real-time settlement active.'
            : 'Core banking rails experiencing simulated downtime. Outgoing payments safely held in local recovery queue.'}
        </p>
        <p className="muted">Queued requests: {queued.length}</p>
        {demo && (
          <div className="row" style={{ marginTop: 12 }}>
            <button className="clay-btn" onClick={onToggleBank}>
              {bankUp ? 'Simulate bank down' : 'Restore bank'}
            </button>
            <button className="clay-btn" onClick={onProcess}>
              Process queue
            </button>
            <button className="clay-btn" onClick={onTimeSkip}>
              Skip 1 hour
            </button>
          </div>
        )}
      </section>

      <section className="clay card" aria-label="Offline queue">
        <h3>Payment recovery queue</h3>
        {queued.length === 0 && <p className="muted">No queued payments.</p>}
        <ul className="list">
          {queued.map((p) => (
            <li key={p.id}>
              <span className="ico out">
                <ArrowRightCircle size={18} />
              </span>
              <div>
                <strong>{p.payee}</strong>
                <small>{formatRupees(p.amount)} · {p.status}{p.coolingUntil ? ' · cooling' : ''}</small>
              </div>
              <span className="status queued">queued</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
