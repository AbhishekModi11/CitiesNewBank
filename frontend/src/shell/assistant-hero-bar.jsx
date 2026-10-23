import { Bot, Sparkles, ArrowRight } from 'lucide-react'

export default function AssistantHeroBar({ onOpen }) {
  return (
    <section
      className="clay card assistant-hero-bar"
      aria-label="Assistant quick query"
      onClick={onOpen}
      style={{
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        border: '1px solid rgba(47, 164, 255, 0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          className="clay-sm round"
          style={{
            width: 44,
            height: 44,
            display: 'grid',
            placeItems: 'center',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-bright))',
            color: '#fff',
          }}
        >
          <Bot size={22} />
        </div>
        <div>
          <strong style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15 }}>
            CitiPay Assistant <Sparkles size={14} color="#FF8A1F" />
          </strong>
          <p className="muted small">Ask about limits, safety policies, or transaction status</p>
        </div>
      </div>
      <button className="clay-btn round" aria-label="Open assistant panel" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
        <ArrowRight size={18} />
      </button>
    </section>
  )
}
