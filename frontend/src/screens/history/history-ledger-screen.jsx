import { useState } from 'react'
import { ArrowUpRight, ArrowDownLeft, ShieldCheck } from 'lucide-react'
import { formatRupees } from '../../lib/money.js'

export default function HistoryLedgerScreen({ txns = [], limit }) {
  const [filter, setFilter] = useState('all') // 'all' | 'debit' | 'credit'

  const filtered = txns.filter((t) => {
    if (filter === 'debit') return t.amount < 0
    if (filter === 'credit') return t.amount > 0
    return true
  })

  const list = limit ? filtered.slice(0, limit) : filtered

  return (
    <section className="clay card" aria-label="Recent activity">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h3>Transaction history</h3>
          <p className="muted small">Cryptographically signed DRUNIX ledger chain</p>
        </div>
        {!limit && (
          <div className="chips">
            {['all', 'debit', 'credit'].map((f) => (
              <button
                key={f}
                className={`chip clay-sm ${filter === f ? 'on' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {list.length === 0 && <p className="muted">No transactions recorded yet.</p>}

      <ul className="list">
        {list.map((t) => (
          <li key={t.id} className={t.fresh ? 'pop' : ''} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`ico ${t.amount < 0 ? 'out' : 'in'}`}>
                  {t.amount < 0 ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                </span>
                <div>
                  <strong>{t.name}</strong>
                  <small>{t.when}{t.status ? ` · ${t.status}` : ''}</small>
                </div>
              </div>
              <b className={t.amount < 0 ? 'neg' : 'pos'}>
                {t.amount < 0 ? '-' : '+'}{formatRupees(Math.abs(t.amount))}
              </b>
            </div>
            {!limit && (
              <div className="clay-sm" style={{ padding: '6px 10px', fontSize: 11, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={12} color="#12A07A" /> DRUNIX block signed
                </span>
                <span className="muted">TXN-{String(t.id).padStart(6, '0')}</span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
