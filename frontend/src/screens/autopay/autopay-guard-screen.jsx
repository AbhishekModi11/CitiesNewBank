import { upcomingMandates } from '../../../../middleware/index.js'
import { formatRupees } from '../../lib/money.js'
import { Repeat, AlertTriangle, CheckCircle } from 'lucide-react'

export default function AutopayGuardScreen({ accounts, onToggleMandate }) {
  const mandates = upcomingMandates(accounts)

  return (
    <div className="col">
      <section className="clay card" aria-label="Autopay and EMI">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Repeat size={24} color="#0A6EC9" />
          <h3>Autopay and EMI guard</h3>
        </div>
        <p className="muted small">
          Active mandate buffer protection. Warns and pauses when projected balance falls below EMI requirements.
        </p>
        {mandates.length === 0 && <p className="muted">No autopay mandates.</p>}
        <ul className="list">
          {mandates.map((m) => (
            <li key={m.accountId}>
              <span className={`ico ${m.atRisk ? 'out' : 'in'}`}>
                {m.atRisk ? <AlertTriangle size={18} color="#E4372D" /> : <CheckCircle size={18} color="#12A07A" />}
              </span>
              <div>
                <strong>{m.label}</strong>
                <small>{m.bank} · {formatRupees(m.amount)} · due {m.due}</small>
                <small className={m.atRisk ? 'err' : 'muted'}>
                  {m.atRisk ? 'Insufficient buffer: Account balance may fail EMI debit' : 'Buffer healthy'}
                </small>
              </div>
              <button className="clay-btn" onClick={() => onToggleMandate(m.accountId)}>
                {m.paused ? 'Resume' : 'Pause'}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
