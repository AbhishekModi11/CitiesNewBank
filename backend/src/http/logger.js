const SECRET_PATTERN = /token|secret|password|pin|otp|authorization|cookie|csrf/i

export function redactSecrets(value, seen = new WeakSet()) {
  if (value == null) return value
  if (typeof value !== 'object') return value
  if (seen.has(value)) return '[Circular]'
  seen.add(value)
  if (Array.isArray(value)) return value.map((item) => redactSecrets(item, seen))
  const output = {}
  for (const [key, item] of Object.entries(value)) {
    output[key] = SECRET_PATTERN.test(key) ? '[REDACTED]' : redactSecrets(item, seen)
  }
  return output
}

export const redactSensitive = redactSecrets
export const redactForLog = redactSecrets
export const redact = redactSecrets

export function formatSafeLogValue(value) {
  try { return JSON.stringify(redactSecrets(value)) } catch { return '[Unserializable]' }
}
