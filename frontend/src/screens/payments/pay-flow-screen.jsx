import { useState } from 'react'
import { Send, Landmark } from 'lucide-react'
import { contacts } from '../../data/sample-seed-state.js'
import { formatRupees } from '../../lib/money.js'

export default function PayFlowScreen({ account, accounts, selected, setSelected, onPay, onOpenBankLink }) {
  const [payee, setPayee] = useState(contacts[0])
  const [custom, setCustom] = useState('')
  const [amount, setAmount] = useState('')
  const targetPayee = custom.trim() || payee
  const value = Number(amount)

  const submit = () => {
    if (!targetPayee || !value || value <= 0) return
    if (!account && accounts.length === 0) {
      if (onOpenBankLink) onOpenBankLink()
      return
    }
    onPay(targetPayee, value, account?.id)
    setAmount('')
    setCustom('')
  }

  return (
    <div className="col">
      <section className="clay card" aria-label="Pay">
        <h3>Pay</h3>
        <p className="muted small">Pay from</p>
        <div className="chips">
          {accounts.map((a) => (
            <button
              key={a.id}
              className={`chip clay-sm ${selected === a.id ? 'on' : ''}`}
              onClick={() => setSelected(a.id)}
            >
              <strong>{a.bank}</strong>
              <span>••{a.last4} · {formatRupees(a.balance)}</span>
            </button>
          ))}
          {accounts.length === 0 && (
            <button className="clay-btn" onClick={onOpenBankLink}>
              <Landmark size={16} /> Link bank account first
            </button>
          )}
        </div>
        <label>
          <span className="muted small">Payee</span>
          <select
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '12px', margin: '6px 0 12px' }}
          >
            {contacts.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>
          <span className="muted small">Or UPI ID</span>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder="name@upi"
            style={{ width: '100%', padding: '10px', borderRadius: '12px', margin: '6px 0 12px' }}
          />
        </label>
        <label className="field clay-in">
          <span>₹</span>
          <input
            inputMode="numeric"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
            aria-label="Amount"
          />
        </label>
        <button className="clay-btn primary grow" onClick={submit}>
          <Send size={18} /> Send {formatRupees(value || 0)} to {targetPayee}
        </button>
      </section>
    </div>
  )
}
