import crypto from 'node:crypto'

const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519')

export function signPayload(payload) {
  const data = Buffer.from(JSON.stringify(payload))
  const sig = crypto.sign(null, data, privateKey)
  return sig.toString('base64')
}

export function verifyPayload(payload, signature) {
  if (!signature) return false
  try {
    return crypto.verify(null, Buffer.from(JSON.stringify(payload)), publicKey, Buffer.from(signature, 'base64'))
  } catch {
    return false
  }
}

export function publicKeyPem() {
  return publicKey.export({ type: 'spki', format: 'pem' })
}
