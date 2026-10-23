import { POLICIES } from '../guideware/policies.js'

export const activateKillSwitch = (state, now = Date.now(), initiatedBy = 'user') => ({
  active: true,
  activatedAt: now,
  lockedUntil: now + POLICIES.killSwitch.lockDurationMs,
  initiatedBy,
})

export const deactivateKillSwitch = (state, now = Date.now()) => {
  if (state?.lockedUntil && now < state.lockedUntil) {
    return { ...state, active: true, blockedAction: 'unlock_too_early' }
  }
  return { active: false, activatedAt: null, lockedUntil: null, initiatedBy: null }
}

export const isKillSwitchActive = (state, now = Date.now()) => {
  if (!state?.active) return false
  if (state.lockedUntil && now >= state.lockedUntil) return false
  return true
}
