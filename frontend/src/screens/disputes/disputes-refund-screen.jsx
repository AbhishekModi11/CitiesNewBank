import { useState } from 'react'
import { formatRupees } from '../../lib/money.js'
import { eligiblePayments, disputeWithStatus } from '../../services/disputes.js'
import { Scale, Clock, AlertCircle } from 'lucide-react'

export default function DisputesRefundScreen({ payments, disputes, onRaise }) {
  const [selected, setSelected] = useState('')
  const [reason, setReason] = useState('')
  const eligible = eligiblePayments(payments)

  const submit = () => {
    const payment = payments.find((p) => p.id === selected)
    if (payment && reason.trim()) {
      onRaise(payment, reason.trim())
      setReason('')
      setSelected('')
    }
  }

  return (
    <div className="col">
      <section className="clay card" aria-label="Raise dispute">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Scale size={24} color="#E8A317" />
          <h3>Dispute helper and statutory refund clock</h3>
        </div>
        <p className="muted small">
          NPCI/RBI regulatory dispute turnaround: T+1 for person-to-person transfers, T+5 for merchant payments. Auto compensation of ₹100/day applies for delays beyond the statutory deadline.
        </p>
        <label>
          <span className="muted small">Settled payment</span>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '12px', margin: '6px 0 12px' }}
          >
            <option value="">Select payment</option>
            {eligible.map((p) => (
              <option key={p.id} value={p.id}>{p.payee} · {formatRupees(p.amount)}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="muted small">Reason for dispute</span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Debited but merchant did not receive"
            style={{ width: '100%', padding: '10px', borderRadius: '12px', margin: '6px 0 12px' }}
          />
        </label>
        <button className="clay-btn primary grow" onClick={submit}>
          Raise statutory dispute
        </button>
      </section>

      <section className="clay card" aria-label="Dispute status">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Clock size={20} color="#0A6EC9" />
          <h3>Active disputes and compensation clocks</h3>
        </div>
        {disputes.length === 0 && <p className="muted">No disputes raised.</p>}
        <ul className="list">
          {disputes.map((d) => {
            const status = disputeWithStatus(d)
            const daysLeft = Math.max(0, Math.round(status.remainingMs / 86400000))
            return (
              <li key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="ico in"><AlertCircle size={18} color="#E8A317" /></span>
                    <div>
                      <strong>{d.payee}</strong>
                      <small>{formatRupees(d.amount)} · {d.reason}</small>
                    </div>
                  </div>
                  <span className="status open">{status.status}</span>
                </div>
                <div className="clay-sm" style={{ padding: '6px 12px', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span className="muted">Target resolution: {daysLeft} day(s) left</span>
                  <span style={{ color: '#12A07A' }}>Statutory penalty: ₹100/day</span>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
