import { createLocalLedger } from './local.js'
import { createDrunixLedger } from './drunix.js'

export function createLedger(db, config) {
  if (config.ledgerMode === 'drunix') return createDrunixLedger(config)
  return createLocalLedger(db)
}
