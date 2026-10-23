import { useState } from 'react'
import { formatRupees } from '../../lib/money.js'
import { withinMemberCap } from '../../../../middleware/index.js'
import { Users, CheckCircle2, Award, Shield } from 'lucide-react'

export default function FamilyCircleScreen({ family, payments, onApprove, onDecline }) {
  const [roleView, setRoleView] = useState('Parent') // 'Adult' | 'Parent' | 'Teen'
  const approvals = payments.filter((p) => p.status === 'awaiting_approval')

  const [chores, setChores] = useState([
    { id: 'c1', title: 'Math homework completed', teen: 'Aarav (Teen)', reward: 250, completed: true, approved: false },
    { id: 'c2', title: 'Clean bedroom & organize books', teen: 'Aarav (Teen)', reward: 150, completed: false, approved: false },
  ])

  const handleApproveChore = (id) => {
    setChores((prev) => prev.map((c) => (c.id === id ? { ...c, approved: true } : c)))
  }

  return (
    <div className="col">
      <section className="clay card" aria-label="Family circle">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={24} color="#0FA3A3" />
            <h3>Family Circle</h3>
          </div>
          <div className="chips">
            {['Parent', 'Adult', 'Teen'].map((r) => (
              <button
                key={r}
                className={`chip clay-sm ${roleView === r ? 'on' : ''}`}
                onClick={() => setRoleView(r)}
              >
                {r} view
              </button>
            ))}
          </div>
        </div>

        <p className="muted small">
          Active governance for family finances. Parent approval required for payments exceeding ₹5,000.
        </p>

        <ul className="list" style={{ marginTop: 12 }}>
          {family.map((m) => (
            <li key={m.id}>
              <span className="avatar sm" style={{ background: '#0FA3A3', color: '#fff' }}>{m.name[0]}</span>
              <div>
                <strong>{m.name}</strong>
                <small>{m.role} · monthly cap {formatRupees(m.monthlyCap)}</small>
                <small className={m.spent + (m.pending ?? 0) > m.monthlyCap ? 'err' : 'muted'}>
                  Spent {formatRupees(m.spent)}
                </small>
              </div>
              <span className="status family">{withinMemberCap(m, 0) ? 'within cap' : 'over cap'}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Approvals section */}
      {(roleView === 'Parent' || roleView === 'Adult') && (
        <section className="clay card" aria-label="Pending approvals">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Shield size={20} color="#0A6EC9" />
            <h3>Pending approvals</h3>
          </div>
          {approvals.length === 0 && <p className="muted">No pending approvals.</p>}
          <ul className="list">
            {approvals.map((p) => (
              <li key={p.id}>
                <span className="ico out">!</span>
                <div>
                  <strong>{p.payee}</strong>
                  <small>{formatRupees(p.amount)} · exceeds ₹5,000 minor threshold</small>
                </div>
                <div className="row">
                  <button className="clay-btn grow" onClick={() => onDecline(p.id)}>Decline</button>
                  <button className="clay-btn primary grow" onClick={() => onApprove(p.id)}>Approve</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Chores and Allowance Section */}
      <section className="clay card" aria-label="Chores and allowance">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Award size={20} color="#E8A317" />
          <h3>Chores and allowance rewards</h3>
        </div>
        <p className="muted small">Earned rewards are verified and settled to the teen's wallet upon parent approval.</p>
        <ul className="list">
          {chores.map((c) => (
            <li key={c.id}>
              <span className={`ico ${c.approved ? 'in' : 'out'}`}>
                {c.approved ? <CheckCircle2 size={18} color="#12A07A" /> : <Award size={18} />}
              </span>
              <div>
                <strong>{c.title}</strong>
                <small>{c.teen} · reward {formatRupees(c.reward)}</small>
                <small className={c.approved ? 'pos' : c.completed ? 'warn' : 'muted'}>
                  {c.approved ? 'Reward released' : c.completed ? 'Awaiting parent sign-off' : 'In progress'}
                </small>
              </div>
              {roleView === 'Parent' && c.completed && !c.approved && (
                <button className="clay-btn primary" onClick={() => handleApproveChore(c.id)}>
                  Release reward
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
