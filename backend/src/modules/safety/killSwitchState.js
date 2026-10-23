export const killSwitchState = { active: false, lockedUntil: null }
export function activateKillSwitch() {
  killSwitchState.active = true
  killSwitchState.lockedUntil = Date.now() + 900000
}
export function deactivateKillSwitch() {
  if (killSwitchState.lockedUntil && Date.now() < killSwitchState.lockedUntil) return false
  killSwitchState.active = false
  killSwitchState.lockedUntil = null
  return true
}
export const isKillSwitchActive = () => killSwitchState.active
