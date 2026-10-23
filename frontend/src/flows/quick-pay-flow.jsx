import { useEffect, useState } from 'react'
import { Send, QrCode, AtSign, AlertTriangle } from 'lucide-react'
import { contacts } from '../data/sample-seed-state.js'
import { checkEmiBuffer } from '../../../middleware/index.js'
import Modal from '../components/modal-dialog.jsx'
import { formatRupees } from '../lib/money'

export default function QuickSend({ account, onPay }) {
  const [who, setWho] = useState(contacts[0])
  const [amount, setAmount] = useState('')
  const [ask, setAsk] = useState(false)
  const [error, setError] = useState('')
  const value = Number(amount)
  const emiCheck = account ? checkEmiBuffer(account, value || 0) : { safe: true, leftAfterPayment: 0 }

  useEffect(() => {
    setAsk(false)
    setError('')
  }, [account?.id])

  const done = () => {
    onPay(who, value, account.id)
    setAmount('')
    setAsk(false)
  }

  const start = () => {
    if (!value || value <= 0) return setError('Enter an amount')
    if (!account || value > account.balance) return setError('Not enough balance in this account')
    setError('')
    if (account?.mandate && !emiCheck.safe) setAsk(true)
    else done()
  }

  return (
    <section className="clay card" aria-label="Quick send">
      <h3>Quick send</h3>
      <div className="people">
        {contacts.map((c) => (
          <button key={c} className={`person ${who === c ? 'on' : ''}`} onClick={() => setWho(c)}>
            <span className="avatar sm">{c[0]}</span>
            <small>{c}</small>
          </button>
        ))}
      </div>

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
      {error && <p className="err">{error}</p>}

      <div className="row">
        <button className="clay-btn primary grow" onClick={start}>
          <Send size={18} /> Send to {who}
        </button>
        <button className="clay-btn round" aria-label="Scan QR code"><QrCode size={20} /></button>
        <button className="clay-btn round" aria-label="Pay to UPI ID"><AtSign size={20} /></button>
      </div>

      {ask && account?.mandate && (
        <Modal open={ask} onClose={() => setAsk(false)} title="Before you pay">
        <AlertTriangle size={28} color="var(--warn)" />
        <h3>Before you pay</h3>
        <p>
          {account?.mandate?.label ?? ""} of {formatRupees(account?.mandate?.amount ?? 0)} will debit {account?.mandate?.due ?? ""} from {account?.bank ?? ""}.
        </p>
        <p className={emiCheck.safe ? 'muted' : 'err'}>
          Balance after this payment: {formatRupees(emiCheck.leftAfterPayment)}
          {!emiCheck.safe && ' (not enough for the account mandate)'}
        </p>
        <div className="row">
          <button className="clay-btn grow" onClick={() => setAsk(false)}>Decline</button>
          <button className="clay-btn primary grow" onClick={done}>Accept</button>
        </div>
      </Modal>
      )}
    </section>
  )
}
