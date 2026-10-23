import { Router } from 'express'
import { z } from 'zod'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import Busboy from 'busboy'
import sharp from 'sharp'
import * as profilesRepo from '../../db/repos/profiles.js'
import * as usersRepo from '../../db/repos/users.js'
import { authRequired, createValidation } from '../../http/auth.js'
import { ApiError } from '../../http/errorHandler.js'
import { isValidIndianMobile, validateProfile, needsGuardian } from '../../../../middleware/validation.js'
import { POLICIES } from '../../../../guideware/policies.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOAD_DIR = path.resolve(__dirname, '../../../uploads')

const profileSchema = z.object({
  body: z.object({
    displayName: z.string().min(1).max(60),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    gender: z.enum(['male', 'female', 'prefer_not_to_say']).nullable().optional(),
    bio: z.string().max(120).optional(),
  }),
})

const MAGIC_BYTES = {
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  jpeg: Buffer.from([0xff, 0xd8, 0xff]),
}

const detectExtension = (mimeType) => {
  const kind = String(mimeType ?? '').split('/')[1] ?? ''
  const map = { png: 'png', jpg: 'jpeg', jpeg: 'jpeg', webp: 'webp' }
  return map[kind] ?? null
}

const hasValidMagicBytes = (buffer, extension) => {
  if (extension === 'png') return buffer.subarray(0, 8).equals(MAGIC_BYTES.png)
  if (extension === 'jpeg') return buffer.subarray(0, 3).equals(MAGIC_BYTES.jpeg)
  if (extension === 'webp') return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  return true
}

export function createProfileRouter(db) {
  const router = Router()
  router.use(authRequired)

  router.get(['/', '/profile'], (req, res) => {
    const profile = profilesRepo.getProfile(db, req.user.id)
    const guardian = profilesRepo.getGuardianLink(db, req.user.id)
    res.json({ profile, guardian })
  })

  router.put(['/', '/profile'], createValidation(profileSchema), async (req, res, next) => {
    try {
      const body = req.validated.body
      const validation = validateProfile({
        displayName: body.displayName,
        dateOfBirth: body.dateOfBirth ?? null,
        bio: body.bio ?? '',
        avatar: null,
      })
      if (!validation.ok) throw new ApiError(400, validation.errors[0])

      const existing = profilesRepo.getProfile(db, req.user.id)
      const guardianConfirmed = existing?.guardian_id ? true : !!profilesRepo.getGuardianLink(db, req.user.id)
      if (needsGuardian(validation.age, guardianConfirmed)) {
        throw new ApiError(403, 'Parental consent is required before payment features unlock')
      }

      const profile = profilesRepo.saveProfile(db, {
        userId: req.user.id,
        displayName: body.displayName.trim(),
        dateOfBirth: body.dateOfBirth ?? null,
        gender: body.gender ?? null,
        bio: String(body.bio ?? '').slice(0, 120),
        avatar: existing?.avatar ?? null,
        guardianId: existing?.guardian_id ?? null,
        completedAt: existing?.completed_at ?? Date.now(),
      })
      res.json({ profile })
    } catch (err) { next(err) }
  })

  router.post(['/avatar', '/profile/avatar'], async (req, res, next) => {
    try {
      const upload = Busboy({ headers: req.headers, limits: { fileSize: POLICIES.profile.avatarMaxBytes } })

      const chunks = []
      let filename = null
      let mimeType = null

      upload.on('file', (fieldname, file, info) => {
        filename = `${req.user.id}-${Date.now()}.webp`
        mimeType = info.mimeType
        file.on('data', (chunk) => chunks.push(chunk))
        file.on('end', () => {})
      })
      upload.on('error', next)
      upload.on('finish', async () => {
        try {
          if (!filename || !mimeType) throw new ApiError(400, 'Avatar file is required')
          const buffer = Buffer.concat(chunks)
          const extension = detectExtension(mimeType)
          if (!extension) throw new ApiError(400, 'Unsupported avatar type')
          if (buffer.length > POLICIES.profile.avatarMaxBytes) throw new ApiError(400, 'Avatar is too large')
          if (!hasValidMagicBytes(buffer, extension)) throw new ApiError(400, 'Invalid avatar file')

          const profileImage = await sharp(buffer).resize(256).webp({ quality: 80 }).toBuffer()
          fs.mkdirSync(UPLOAD_DIR, { recursive: true })
          fs.writeFileSync(path.join(UPLOAD_DIR, filename), profileImage)
          const avatar = filename

          const existing = profilesRepo.getProfile(db, req.user.id)
          const profile = profilesRepo.saveProfile(db, {
            userId: req.user.id,
            displayName: existing?.display_name ?? 'User',
            dateOfBirth: existing?.date_of_birth ?? null,
            gender: existing?.gender ?? null,
            bio: existing?.bio ?? '',
            avatar,
            guardianId: existing?.guardian_id ?? null,
            completedAt: existing?.completed_at ?? Date.now(),
          })
          res.json({ profile, avatar })
        } catch (err) { next(err) }
      })

      req.pipe(upload)
    } catch (err) { next(err) }
  })

  return router
}
