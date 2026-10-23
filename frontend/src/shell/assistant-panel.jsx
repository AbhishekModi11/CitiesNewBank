import { useState } from 'react'
import { Bot, Send, X, Lock } from 'lucide-react'
import { assistantReply } from '../services/assistant.js'

export default function AssistantPanel({ open, onClose, appState }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'CitiPay Assistant active. Ask about policies, transaction status, or dispute turnaround.',
    },
  ])

  if (!open) return null

  const send = () => {
    const text = input.trim()
    if (!text) return
    const reply = assistantReply(text, appState)
    setMessages((prev) => [...prev, { role: 'user', text }, { role: 'assistant', text: reply }])
    setInput('')
  }

  return (
    <div className="assistant-panel-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="CitiPay Assistant">
      <aside
        className="assistant-panel clay"
        onClick={(e) => e.stopPropagation()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          zIndex: 999,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bot size={22} color="#0A6EC9" />
            <strong style={{ fontSize: 16 }}>CitiPay Assistant</strong>
          </div>
          <button className="clay-btn round" onClick={onClose} aria-label="Close assistant">
            <X size={16} />
          </button>
        </div>

        <div className="clay-sm" style={{ padding: '6px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Lock size={12} color="#12A07A" />
          <span>Read-only tools · Never handles PINs or moves money</span>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            paddingRight: 4,
            minHeight: 220,
            maxHeight: 400,
          }}
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={`clay-sm ${m.role === 'user' ? 'user-bubble' : 'bot-bubble'}`}
              style={{
                padding: '10px 14px',
                borderRadius: 14,
                maxWidth: '85%',
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                background: m.role === 'user' ? 'var(--primary)' : 'var(--clay-surface)',
                color: m.role === 'user' ? '#fff' : 'var(--ink)',
              }}
            >
              {m.text}
            </div>
          ))}
        </div>

        <div className="row" style={{ marginTop: 12 }}>
          <input
            className="field clay-in"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask a question..."
            style={{ flex: 1, padding: 10 }}
            aria-label="Ask assistant"
          />
          <button className="clay-btn primary" onClick={send} aria-label="Send query">
            <Send size={16} />
          </button>
        </div>
      </aside>
    </div>
  )
}
