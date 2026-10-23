import { POLICIES } from '../guideware/policies.js'

const MOBILE_PATTERN = /^[6-9]\d{9}$/
const LAST4_PATTERN = /^\d{4}$/

export const isValidIndianMobile = (mobile) =>
  typeof mobile === 'string' && MOBILE_PATTERN.test(mobile.trim())

export const isValidLast4 = (value) =>
  typeof value === 'string' && LAST4_PATTERN.test(value)

export const calculateAge = (dob, now = Date.now()) => {
  if (!dob) return null
  const born = new Date(`${dob}T00:00:00`)
  if (Number.isNaN(born.getTime())) return null
  const today = new Date(now)
  let age = today.getFullYear() - born.getFullYear()
  const birthdayPassed =
    today.getMonth() > born.getMonth() ||
    (today.getMonth() === born.getMonth() && today.getDate() >= born.getDate())
  if (!birthdayPassed) age -= 1
  return age
}

export const validateProfile = (profile, policies = POLICIES.profile) => {
  const errors = []
  const age = calculateAge(profile.dateOfBirth)
  if (age === null) errors.push('Enter a valid date of birth')

  const displayName = String(profile.displayName ?? '').trim()
  if (policies.displayNameRequired && !displayName) errors.push('Name is required')

  const bio = String(profile.bio ?? '')
  if (bio.length > policies.bioMaxChars) errors.push('Bio is too long')

  const avatar = profile.avatar
  if (avatar) {
    const extension = String(avatar.mimeType ?? '').split('/')[1] ?? ''
    if (!policies.avatarFormats.includes(extension)) errors.push('Avatar type is not supported')
    else if (!avatar.sizeBytes || avatar.sizeBytes > policies.avatarMaxBytes) errors.push('Avatar is too large')
  }

  return { ok: errors.length === 0, errors, age }
}

export const needsGuardian = (age, guardianConfirmed, policies = POLICIES.minors) =>
  guardianConfirmed !== true && age !== null && age < policies.adultAge

export const canLinkMoreBankAccounts = (linkedCount, policies = POLICIES.bankLinking) =>
  linkedCount < policies.maxAccounts
