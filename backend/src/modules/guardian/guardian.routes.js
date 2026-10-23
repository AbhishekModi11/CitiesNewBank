import { Router } from 'express'
import { z } from 'zod'
import * as usersRepo from '../../db/repos/users.js'
import * as profilesRepo from '../../db/repos/profiles.js'
import { authRequired, createValidation } from '../../http/auth.js'
import { ApiError } from '../../http/errorHandler.js'

const requestGuardianSchema = z.object({
  body: z.object({ teenMobile: z.string().regex(/^\d{10}$/) }),
})

const confirmGuardianSchema = z.object({
  body: z.object({ teenMobile: z.string().regex(/^\d{10}$/) }),
})

export function createGuardianRouter(db) {
  const router = Router()
  router.use(authRequired)

  router.post(['/request', '/guardian/request'], createValidation(requestGuardianSchema), (req, res) => {
    const { teenMobile } = req.validated.body
    const teen = usersRepo.findUserByMobile(db, teenMobile)
    if (!teen) return res.status(404).json({ error: 'Teen not found' })
    const existing = profilesRepo.getGuardianLink(db, teen.id)
    if (existing?.status === 'confirmed') return res.status(409).json({ error: 'Guardian already confirmed' })

    const link = profilesRepo.upsertGuardianLink(db, { teenId: teen.id, parentId: req.user.id })
    res.json({ guardianLink: { id: link?.id ?? 'pending', teenMobile, status: 'pending' } })
  })

  router.post(['/confirm', '/guardian/confirm'], createValidation(confirmGuardianSchema), (req, res) => {
    const { teenMobile } = req.validated.body
    const teen = usersRepo.findUserByMobile(db, teenMobile)
    if (!teen) return res.status(404).json({ error: 'Teen not found' })
    let link = profilesRepo.getGuardianLink(db, teen.id)
    if (!link) {
      link = profilesRepo.upsertGuardianLink(db, { teenId: teen.id, parentId: req.user.id })
    }
    profilesRepo.confirmGuardian(db, req.user.id, teen.id)
    res.json({ status: 'confirmed', teenMobile })
  })

  return router
}
