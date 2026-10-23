import crypto from 'node:crypto'
import { POLICIES } from '../guideware/policies.js'

export const createPaymentAddress = () =>
  crypto.randomBytes(8).toString('base64url')

export const buildPaymentUri = ({ address, displayName }) =>
  `citipay://pay/${address}?name=${encodeURIComponent(displayName ?? '')}`

export const amountQrExpiresAt = (createdAt = Date.now(), ttl = POLICIES.qr.amountQrExpiryMs) =>
  createdAt + ttl
