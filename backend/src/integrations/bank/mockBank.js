let up = true
export const bankState = {
  get up() { return up },
  set(upFlag) { up = Boolean(upFlag) },
}
export function mockBankPay() {
  if (!up) throw new Error('BANK_DOWN')
  return { settlementRef: `settle-${Date.now()}` }
}
export const bankUpStatus = () => up
export const setBankUpStatus = (value) => { up = Boolean(value) }
