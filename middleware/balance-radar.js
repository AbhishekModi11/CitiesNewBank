import { POLICIES } from '../guideware/policies.js'

export const forecastBalances = (accounts, recurringDebits = [], days = POLICIES.balanceRadar.forecastDays, now = Date.now()) => {
  const total = accounts.reduce((sum, a) => sum + a.balance, 0)
  const dailyOut = recurringDebits.reduce((sum, d) => sum + (d.amount ?? 0), 0) / 30
  const series = []
  let balance = total
  for (let i = 0; i < days; i += 1) {
    balance -= dailyOut
    series.push({
      day: i + 1,
      date: new Date(now + i * 86400000).toISOString().slice(0, 10),
      balance: Math.round(balance),
      low: balance < POLICIES.balanceRadar.lowBalanceThreshold,
    })
  }
  return series
}

export const balanceRadarStatus = (series) => {
  if (series.some((s) => s.balance < 0)) return 'danger'
  if (series.some((s) => s.low)) return 'warning'
  return 'ok'
}
