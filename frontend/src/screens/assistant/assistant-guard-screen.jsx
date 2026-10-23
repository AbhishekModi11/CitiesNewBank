import { useState } from 'react'
import { Bot, Send, ShieldCheck, Lock } from 'lucide-react'
import { assistantReply } from '../../services/assistant.js'

export default function AssistantGuardScreen({ appState }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello, I am CitiPay Assistant. I have read-only visibility into limits, policies, and ledger status. I cannot move money, reveal PINs/OTPs, or approve payments.',
    },
  ])

  const send = () => {
    const text = input.trim()
    if (!text) return
    const reply = assistantReply(text, appState)
    setMessages((items) => [...items, { role: 'user', text }, { role: 'assistant', text: reply }])
    setInput('')
  }

  return (
    <div className="col">
      <section className="clay card" aria-label="Assistant">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bot size={24} color="#0A6EC9" />
            <h3>Guarded assistant</h3>
          </div>
          <span className="clay-sm" style={{ padding: '4px 8px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Lock size={12} color="#12A07A" /> Read-only tools
          </span>
        </div>
        <p className="muted small">
          Protected by server guardrails. Strictly rejects money transfers, rule bypasses, and credential exposure.
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxHeight: 380,
            overflowY: 'auto',
            margin: '16px 0',
            paddingRight: 4,
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`clay-sm ${m.role === 'user' ? 'user-bubble' : 'bot-bubble'}`}
              style={{
                padding: '12px 16px',
                borderRadius: 16,
                maxWidth: '85%',
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? 'var(--primary)' : 'var(--clay-surface)',
                color: m.role === 'user' ? '#fff' : 'var(--ink)',
              }}
            >
              {m.role === 'assistant' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 12, opacity: 0.8 }}>
                  <ShieldCheck size={14} /> CitiPay Safe Assistant
                </div>
              )}
              {m.text}
            </div>
          ))}
        </div>

        <div className="row" style={{ marginTop: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask about payments, limits, or disputes..."
            style={{ flex: 1, padding: 12, borderRadius: 14 }}
            aria-label="Assistant message"
          />
          <button className="clay-btn primary" onClick={send} aria-label="Send query">
            <Send size={18} />
          </button>
        </div>
      </section>
    </div>
  )
}
