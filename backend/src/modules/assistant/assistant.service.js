import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { guardAssistantIntent, sanitizeAssistantMessage, assistantReply } from '../../../../middleware/index.js'
import { createLLM } from '../../integrations/llm/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const aiPolicy = fs.readFileSync(path.resolve(__dirname, '../../../../guideware/ai-policy.js'), 'utf8')

function buildContext(db, user) {
  const accounts = db.allRows('SELECT * FROM accounts WHERE user_id = ?', [user.id])
  const payments = db.allRows('SELECT status FROM payments WHERE user_id = ?', [user.id])
  return { accounts, payments }
}

function filterSecrets(text) {
  return text.replace(/\b\d{4,6}\b/g, '[redacted]').replace(/otp|pin/gi, '[redacted]')
}

function hasSecretRequest(text) {
  return /pin|otp|password/i.test(text)
}

export function createAssistantService(db, config) {
  const llm = createLLM(config)
  return {
    async message(user, message) {
      const clean = sanitizeAssistantMessage(message)
      if (!clean) return { reply: 'Please send a message.' }
      const guard = guardAssistantIntent('explain_status', {
        requestsMoneyMovement: /pay|send|transfer|move/i.test(clean),
        requestsApproval: /approve/i.test(clean),
        requestsSecret: hasSecretRequest(clean),
      })
      if (!guard.allowed || hasSecretRequest(clean) || /pay|send|transfer|move/i.test(clean)) {
        return { reply: 'I cannot move money, approve payments, or reveal secrets. I can help track payments, open disputes, pause payments, or open screens.' }
      }
      const context = buildContext(db, user)
      const summary = assistantReply(clean, { payments: context.payments, accounts: context.accounts, bankUp: true, killSwitch: { active: false } })
      const system = `${aiPolicy}\n\nRead-only context: ${JSON.stringify(context).slice(0, 1000)}`
      if (llm.provider !== 'none' && config.llmApiKey) {
        try {
          const llmReply = await llm.chat([{ role: 'user', content: clean }], system)
          if (llmReply) return { reply: filterSecrets(llmReply) }
        } catch {
          return { reply: filterSecrets(summary) }
        }
      }
      return { reply: filterSecrets(summary) }
    },
  }
}

