import { useEffect, useState } from 'react'
import { formatRupees } from '../lib/money'

function useCountUp(target) {
  const [value, setValue] = useState(target)
  useEffect(() => {
    let raf
    let start = null
    const from = value
    const step = (t) => {
      if (start === null) start = t
      const p = Math.min((t - start) / 700, 1)
      setValue(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target])
  return value
}

export default function BalanceCard({ accounts, selected, setSelected }) {
  const total = accounts.reduce((sum, a) => sum + a.balance, 0)
  const shown = useCountUp(total)
  const bestId = [...accounts].sort((a, b) => b.balance - a.balance)[0]?.id

  return (
    <section className="clay card" aria-label="Balances">
      <p className="muted">Total balance</p>
      <h2 className="amount">{formatRupees(shown)}</h2>
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
            {a.id === bestId && <em className="tag">Highest balance</em>}
            {a.mandate && <em className="tag warn">EMI {a.mandate.due}</em>}
          </button>
        ))}
      </div>
    </section>
  )
}
