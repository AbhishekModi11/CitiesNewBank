import { formatRupees } from '../../lib/money.js'
import { ShieldAlert, AlertOctagon, ShieldCheck } from 'lucide-react'

export default function ScamCoolingScreen({ payments, onCancel }) {
  const flagged = payments.filter((p) => (p.riskScore ?? 0) >= 50 || p.status === 'blocked' || p.status === 'cooling')

  return (
    <div className="col">
      <section className="clay card" aria-label="Scam shield">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <ShieldAlert size={24} color="#E8A317" />
          <h3>Scam shield cooling</h3>
        </div>
        <p className="muted small">
          Automated heuristic protection. Flags new payees above ₹10,000 with a 60-minute cooling delay and instant cancel.
        </p>
        <p className="muted">Flagged transactions: {flagged.length}</p>
        {flagged.length === 0 && (
          <p className="pos" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={16} /> All transactions currently safe.
          </p>
        )}
        <ul className="list">
          {flagged.map((p) => (
            <li key={p.id}>
              <span className="ico out">
                <AlertOctagon size={18} color="#E4372D" />
              </span>
              <div>
                <strong>{p.payee}</strong>
                <small>{formatRupees(p.amount)} · risk score {p.riskScore ?? 0}</small>
                <small className="err">{(p.warnings ?? []).join(', ') || 'Blocked by scam shield'}</small>
              </div>
              <div className="row">
                <span className={`status ${p.status === 'blocked' ? 'blocked' : 'warning'}`}>{p.status}</span>
                {p.status === 'cooling' && onCancel && (
                  <button className="clay-btn" onClick={() => onCancel(p.id)}>Cancel</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
