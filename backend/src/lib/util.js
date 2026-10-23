import crypto from 'node:crypto'

export const newId = () => crypto.randomUUID()

export const nowMs = () => Date.now()
