import { formatRupees } from '../../lib/money.js'
import { CheckCircle2, Clock, ShieldCheck, XCircle } from 'lucide-react'

const stateLabel = (status) => status.replace(/_/g, ' ')

export default function PaymentTrackerScreen({ payments, onCancel }) {
  const active = payments.filter((p) => !['completed', 'failed', 'blocked', 'cancelled', 'declined'].includes(p.status))
  const history = payments.filter((p) => ['completed', 'failed', 'blocked', 'cancelled', 'declined'].includes(p.status))

  return (
    <div className="col">
      <section className="clay card" aria-label="Payment tracker">
        <h3>Where is my money</h3>
        <p className="muted small">Live timeline and signed DRUNIX ledger status</p>
        {payments.length === 0 && <p className="muted">No payments tracked.</p>}
        <ul className="list">
          {payments.map((p) => (
            <li key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`ico ${p.status === 'completed' ? 'in' : 'out'}`}>
                    {p.status === 'completed' ? <CheckCircle2 size={18} /> : p.status === 'blocked' ? <XCircle size={18} /> : <Clock size={18} />}
                  </span>
                  <div>
                    <strong>{p.payee}</strong>
                    <small>{formatRupees(p.amount)} · {stateLabel(p.status)}{p.riskScore ? ` · risk ${p.riskScore}` : ''}</small>
                  </div>
                </div>
                <div className="row">
                  <span className={`status ${p.status}`}>{stateLabel(p.status)}</span>
                  {active.includes(p) && (
                    <button className="clay-btn" onClick={() => onCancel(p.id)}>Cancel</button>
                  )}
                </div>
              </div>
              <div className="clay-sm" style={{ padding: '8px 12px', fontSize: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={14} color="#12A07A" /> DRUNIX signed entry
                </span>
                <span className="muted">ID: {p.id.slice(0, 10)}...</span>
              </div>
              {p.warnings?.length ? (
                <div className="err small">{p.warnings.join(', ')}</div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      {history.length > 0 && (
        <section className="clay card">
          <h3>Settled payments</h3>
          <p className="muted">{history.length} payment(s) completed and verified on ledger.</p>
        </section>
      )}
    </div>
  )
}
