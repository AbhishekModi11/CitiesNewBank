import { Router } from 'express'
import { authRequired, createValidation } from '../../http/auth.js'
import { z } from 'zod'
import * as rulesRepo from '../../db/repos/rules.js'
import * as choresRepo from '../../db/repos/chores.js'

export function createFamilyRouter(db) {
  const router = Router()
  router.use(authRequired)
  // members
  router.get('/members', (req, res) => {
    if (req.user.role === 'parent') {
      res.json({ members: rulesRepo.listTeensForParent(db, req.user.id) })
    } else {
      res.json({ members: [] })
    }
  })
  router.get('/rules', (req, res) => {
    if (req.user.role === 'teen') res.json({ rules: rulesRepo.listRulesByTeen(db, req.user.id) })
    else res.json({ rules: [] })
  })
  const ruleSchema = z.object({
    body: z.object({ teenId: z.string(), scope: z.string().optional(), category: z.string().optional(), amountCap: z.number().optional(), dailyCap: z.number().optional() }),
    params: z.object({}),
    query: z.object({}),
    headers: z.object({}).passthrough(),
  })
  router.post('/rules', createValidation(ruleSchema), (req, res) => {
    const b = req.validated.body
    const rule = rulesRepo.createRule(db, { familyId: 'family-1', teenId: b.teenId, scope: b.scope || 'teen', category: b.category, amountCap: b.amountCap, dailyCap: b.dailyCap })
    res.status(201).json({ rule })
  })
  // chores
  router.get('/chores', (req, res) => {
    const teenId = req.user.role === 'teen' ? req.user.id : null
    res.json({ chores: choresRepo.listChores(db, { teenId }) })
  })
  router.post('/chores', (req, res) => {
    const { title, amount, teenId } = req.body || {}
    const chore = choresRepo.createChore(db, { familyId: 'family-1', teenId: teenId || req.user.id, title, amount: Number(amount) || 0 })
    res.status(201).json({ chore })
  })
  router.post('/chores/:id/complete', (req, res, next) => {
    try {
      const chore = choresRepo.setChoreStatus(db, req.params.id, 'completed', { completed_at: Date.now() })
      res.json({ chore })
    } catch (e) { next(e) }
  })
  router.post('/chores/:id/approve', (req, res, next) => {
    try {
      const chore = choresRepo.setChoreStatus(db, req.params.id, 'approved', { approved_at: Date.now() })
      res.json({ chore })
    } catch (e) { next(e) }
  })
  router.post('/chores/:id/release', (req, res, next) => {
    try {
      const chore = choresRepo.setChoreStatus(db, req.params.id, 'released', { released_at: Date.now() })
      res.json({ chore })
    } catch (e) { next(e) }
  })
  return router
}
