import { POLICIES } from '../guideware/policies.js'

const ALLOWED_INTENTS = new Set([
  'track_payment',
  'open_dispute',
  'freeze_payments',
  'explain_status',
  'open_screen',
])

export const guardAssistantIntent = (intent, context = {}) => {
  const allowed = ALLOWED_INTENTS.has(intent)
  const policy = {
    mayMoveMoney: false,
    mayApprovePayments: false,
    mayRevealSecrets: false,
    maxLength: POLICIES.assistant.maxMessageLength,
  }
  const violations = []
  if (!allowed) violations.push('unsupported_intent')
  if (context.requestsMoneyMovement) violations.push('money_movement_blocked')
  if (context.requestsApproval) violations.push('approval_blocked')
  if (context.requestsSecret) violations.push('secret_blocked')

  return {
    allowed: violations.length === 0,
    violations,
    policy,
  }
}

export const sanitizeAssistantMessage = (message) => {
  const trimmed = String(message ?? '').trim().slice(0, POLICIES.assistant.maxMessageLength)
  return trimmed.replace(/\s+/g, ' ')
}

const INTENT_RULES = [
  { match: /track|status|payment/, intent: 'track_payment' },
  { match: /dispute/, intent: 'open_dispute' },
  { match: /freeze|pause|kill/, intent: 'freeze_payments' },
  { match: /open|go|screen/, intent: 'open_screen' },
  { match: /what|explain|help/, intent: 'explain_status' },
]

export const classifyAssistantIntent = (message) => {
  const text = sanitizeAssistantMessage(message).toLowerCase()
  const rule = INTENT_RULES.find((r) => r.match.test(text))
  const intent = rule?.intent ?? 'explain_status'
  const guard = guardAssistantIntent(intent, {
    requestsMoneyMovement: /pay|send|transfer/.test(text),
    requestsApproval: /approve/.test(text),
    requestsSecret: /pin|otp|password/.test(text),
  })
  return { intent, guard }
}

export const assistantReply = (message, appState = {}) => {
  const { intent, guard } = classifyAssistantIntent(message)
  if (!guard.allowed) {
    return 'I cannot move money, approve payments, or reveal secrets. I can help track payments, open disputes, pause payments, or open screens.'
  }
  switch (intent) {
    case 'track_payment':
      return `You have ${(appState.payments ?? []).length} tracked payments, ${(appState.payments ?? []).filter((p) => p.status !== 'completed').length} not completed.`
    case 'open_dispute':
      return 'Open the Disputes screen to raise or review a dispute.'
    case 'freeze_payments':
      return 'Open Kill switch to pause payments. No payments will move while it is active.'
    case 'open_screen':
      return 'Use the navigation bar to open any screen.'
    default:
      return 'Ask about a payment, dispute, balance, or screen to open.'
  }
}
