import { formatRupees } from '../../lib/money.js'
import { forecastBalances, balanceRadarStatus } from '../../../../middleware/index.js'
import { Radar, TrendingDown, TrendingUp } from 'lucide-react'

export default function BalanceRadarScreen({ accounts }) {
  const recurring = accounts.filter((a) => a.mandate).map((a) => ({ amount: a.mandate.amount }))
  const series = forecastBalances(accounts, recurring, 14)
  const status = balanceRadarStatus(series)

  return (
    <div className="col">
      <section className="clay card" aria-label="Balance radar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Radar size={24} color="#0B2A5B" />
          <h3>Balance radar</h3>
        </div>
        <p className="muted small">
          Predictive balance trajectory over 14 days considering scheduled autopays, EMIs and recurring debits.
        </p>
        <div style={{ margin: '12px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="muted">Forecast health:</span>
          <span className={`status ${status === 'danger' ? 'blocked' : status === 'warning' ? 'warning' : 'settled'}`}>
            {status}
          </span>
        </div>
        <ul className="list">
          {series.map((s) => (
            <li key={s.day}>
              <span className="ico in">
                {s.low ? <TrendingDown size={18} color="#E4372D" /> : <TrendingUp size={18} color="#12A07A" />}
              </span>
              <div>
                <strong>Day {s.day}</strong>
                <small>{s.date}</small>
              </div>
              <b className={s.low ? 'neg' : 'pos'}>{formatRupees(s.balance)}</b>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
