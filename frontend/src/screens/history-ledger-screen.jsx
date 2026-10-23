import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { formatRupees } from '../lib/money'

export default function Transactions({ txns, limit }) {
  const list = limit ? txns.slice(0, limit) : txns
  return (
    <section className="clay card" aria-label="Recent activity">
      <h3>Recent activity</h3>
      <ul className="list">
        {list.map((t) => (
          <li key={t.id} className={t.fresh ? 'pop' : ''}>
            <span className={`ico ${t.amount < 0 ? 'out' : 'in'}`}>
              {t.amount < 0 ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
            </span>
            <div>
              <strong>{t.name}</strong>
              <small>{t.when}{t.status ? ` · ${t.status}` : ''}</small>
            </div>
            <b className={t.amount < 0 ? 'neg' : 'pos'}>
              {t.amount < 0 ? '-' : '+'}{formatRupees(Math.abs(t.amount))}
            </b>
          </li>
        ))}
      </ul>
    </section>
  )
}
