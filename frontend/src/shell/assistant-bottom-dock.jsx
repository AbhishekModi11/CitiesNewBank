import { Bot, Sparkles } from 'lucide-react'

export default function AssistantBottomDock({ currentView, onOpen }) {
  if (currentView === 'assistant') return null

  return (
    <div
      className="assistant-bottom-dock clay"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      aria-label="Open CitiPay Assistant"
      style={{
        position: 'fixed',
        bottom: 80,
        right: 20,
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 16px',
        borderRadius: 24,
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(10, 110, 201, 0.25)',
      }}
    >
      <Bot size={18} color="#0A6EC9" />
      <span style={{ fontSize: 13, fontWeight: 600 }}>Ask CitiPay</span>
      <Sparkles size={12} color="#FF8A1F" />
    </div>
  )
}
