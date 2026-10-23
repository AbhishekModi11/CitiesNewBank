import { useState } from 'react'
import { Landmark, RefreshCw, Plus, ShieldCheck } from 'lucide-react'
import { formatRupees } from '../../lib/money.js'

export default function BalanceCheckScreen({ accounts, onOpenBankLink, onSetPrimary }) {
  const [refreshing, setRefreshing] = useState(false)

  const handleCheck = (id) => {
    setRefreshing(true)
    setTimeout(() => {
      setCheckedAccounts((prev) => ({ ...prev, [id]: true }))
      setRefreshing(false)
    }, 400)
  }

  return (
    <div className="col">
      <section className="clay card" aria-label="Balance check">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Landmark size={24} color="#0A6EC9" />
            <h3>Balance check</h3>
          </div>
          <button
            className="clay-btn round"
            onClick={() => handleCheck('all')}
            disabled={refreshing}
            aria-label="Refresh balance"
          >
            <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
          </button>
        </div>

        <p className="muted small">
          Linked bank accounts on UPI rails. Account numbers are masked to last 4 digits only. Bank verification is simulated without collecting real UPI PINs.
        </p>

        <ul className="list" style={{ marginTop: 14 }}>
          {accounts.map((a) => (
            <li key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="ico in">
                    <Landmark size={20} color="#0A6EC9" />
                  </span>
                  <div>
                    <strong>{a.bank}</strong>
                    <small>A/C •••• {a.last4}{a.isPrimary ? ' · Primary' : ''}</small>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <b className="pos">{formatRupees(a.balance)}</b>
                  <div className="muted small" style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                    <ShieldCheck size={12} color="#12A07A" /> Bank verified
                  </div>
                </div>
              </div>

              <div className="row" style={{ marginTop: 4 }}>
                <button
                  className="clay-btn grow"
                  onClick={() => handleCheck(a.id)}
                >
                  Verify balance
                </button>
                {!a.isPrimary && onSetPrimary && (
                  <button
                    className="clay-btn grow"
                    onClick={() => onSetPrimary(a.id)}
                  >
                    Set as primary
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        <button
          className="clay-btn primary grow"
          style={{ marginTop: 14, width: '100%' }}
          onClick={onOpenBankLink}
        >
          <Plus size={18} /> Link new bank account
        </button>
      </section>
    </div>
  )
}
