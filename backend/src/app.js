import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { createAuthRouter } from './modules/auth/auth.routes.js'
import { createAccountsRouter } from './modules/accounts/accounts.routes.js'
import { createPaymentsRouter } from './modules/payments/payments.routes.js'
import { createFamilyRouter } from './modules/family/family.routes.js'
import { createSafetyRouter } from './modules/safety/safety.routes.js'
import { createBanksRouter } from './modules/banks/banks.routes.js'
import { createDisputesRouter } from './modules/disputes/disputes.routes.js'
import { createAssistantRouter } from './modules/assistant/assistant.routes.js'
import { createNotificationsRouter } from './modules/notifications/notifications.routes.js'
import { createProfileRouter } from './modules/profile/profile.routes.js'
import { createGuardianRouter } from './modules/guardian/guardian.routes.js'
import { createQrRouter } from './modules/qr/qr.routes.js'
import { createBalanceRouter } from './modules/balance/balance.routes.js'
import { createPaymentService } from './modules/payments/payments.service.js'
import { createLedger } from './integrations/ledger/index.js'
import { errorHandler } from './http/errorHandler.js'
import { startRetryWorker } from './jobs/retryWorker.js'
import { config } from './config.js'
import { parseCookies } from './http/auth.js'
import { killSwitchState } from './modules/safety/killSwitchState.js'
import { setSmsDemoMode } from './integrations/sms/index.js'

export function createApp({ db }) {
  const app = express()
  app.locals.db = db
  app.use((req, res, next) => {
    req.db = db
    next()
  })
  const ledger = createLedger(db, config)
  const paymentService = createPaymentService({ db, ledger, killSwitch: killSwitchState })
  setSmsDemoMode(config.demo)

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", ...config.frontendOrigins],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
  }))
  app.use(cors({ origin: config.frontendOrigins, credentials: true }))
  app.use(rateLimit({ windowMs: 60000, max: 300 }))
  app.use(express.json({ limit: '100kb' }))
  app.use((req, res, next) => {
    const cookies = parseCookies(req)
    const stateChanging = ['POST','PUT','PATCH','DELETE'].includes(req.method)
    if (cookies.session && stateChanging) {
      const csrfHeader = req.get('x-csrf-token')
      if (!csrfHeader || csrfHeader !== cookies.csrf) return res.status(403).json({ error: 'CSRF token mismatch' })
    }
    next()
  })

  app.get('/health', (req, res) => res.json({ ok: true }))
  app.get('/ready', (req, res) => res.json({ ok: true, ledgerMode: config.ledgerMode }))

  app.use('/auth', createAuthRouter(db))
  app.use('/accounts', createAccountsRouter(db))
  app.use('/profile', createProfileRouter(db))
  app.use('/guardian', createGuardianRouter(db))
  app.use('/qr', createQrRouter(db))
  app.use('/balances', createBalanceRouter(db))
  app.use('/payments', createPaymentsRouter(paymentService, db))
  app.use('/family', createFamilyRouter(db))
  app.use('/safety', createSafetyRouter())
  app.use('/banks', createBanksRouter())
  app.use('/disputes', createDisputesRouter(db))
  app.use('/assistant', createAssistantRouter(db, config))
  app.use('/notifications', createNotificationsRouter(db))

  // aliases for local ledger verify
  app.get('/ledger/verify', (req, res) => res.json(ledger.verifyChain()))
  app.get('/ledger/history/:paymentId', (req, res) => res.json({ entries: ledger.getPaymentHistory(req.params.paymentId) }))

  startRetryWorker(db, ledger)
  app.use(errorHandler)
  return app
}





