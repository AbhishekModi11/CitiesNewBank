import BalanceSummaryCard from '../../components/balance-summary-card.jsx'
import QuickPayFlow from '../../flows/quick-pay-flow.jsx'
import HistoryLedgerScreen from '../history/history-ledger-screen.jsx'
import ReceiveQrWidget from './receive-qr-widget.jsx'
import AssistantHeroBar from '../../shell/assistant-hero-bar.jsx'
import {
  Users,
  Clock,
  Scale,
  Power,
  Radar,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react'

export default function HomeWidgetBoard({
  accounts,
  selected,
  setSelected,
  account,
  onPay,
  txns,
  payments,
  family,
  disputes,
  killSwitch,
  onNavigate,
  onOpenAssistant,
  onToggleKillSwitch,
}) {
  const activePayments = payments.filter((p) => !['completed', 'failed', 'blocked', 'cancelled'].includes(p.status))
  const approvals = payments.filter((p) => p.status === 'awaiting_approval')

  return (
    <div className="home-widget-grid" aria-label="Home widgets dashboard">
      {/* 1. Balance Widget */}
      <div className="widget-card-wrapper span-1">
        <BalanceSummaryCard accounts={accounts} selected={selected} setSelected={setSelected} />
      </div>

      {/* 2. Quick Pay Widget */}
      <div className="widget-card-wrapper span-2">
        <QuickPayFlow account={account} onPay={onPay} />
      </div>

      {/* 3. Assistant Hero Widget */}
      <div className="widget-card-wrapper span-3">
        <AssistantHeroBar onOpen={onOpenAssistant} />
      </div>

      {/* 4. Family Circle Widget */}
      <div className="widget-card-wrapper span-1">
        <section className="clay card widget-box" aria-label="Family Circle widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={20} color="#0FA3A3" />
              <h3>Family Circle</h3>
            </div>
            <button className="clay-btn round sm" onClick={() => onNavigate('family')} aria-label="Go to Family Circle details">
              <ArrowRight size={14} />
            </button>
          </div>
          <p className="muted small">
            {family.length} members · {approvals.length} pending approval(s)
          </p>
          <div style={{ marginTop: 8 }}>
            {approvals.length > 0 ? (
              <span className="status warning">{approvals.length} teen approval pending</span>
            ) : (
              <span className="pos small" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={14} /> All allowances within limit
              </span>
            )}
          </div>
        </section>
      </div>

      {/* 5. Where Is My Money Widget */}
      <div className="widget-card-wrapper span-1">
        <section className="clay card widget-box" aria-label="Where is my money widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={20} color="#0A6EC9" />
              <h3>Where is my money</h3>
            </div>
            <button className="clay-btn round sm" onClick={() => onNavigate('tracker')} aria-label="Go to Where is my money">
              <ArrowRight size={14} />
            </button>
          </div>
          <p className="muted small">Active live tracking</p>
          <div style={{ marginTop: 8 }}>
            <span className="status queued">
              {activePayments.length} payment(s) in transit
            </span>
          </div>
        </section>
      </div>

      {/* 6. Disputes & Refund Clock Widget */}
      <div className="widget-card-wrapper span-1">
        <section className="clay card widget-box" aria-label="Disputes widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Scale size={20} color="#E8A317" />
              <h3>Disputes helper</h3>
            </div>
            <button className="clay-btn round sm" onClick={() => onNavigate('disputes')} aria-label="Go to Dispute Helper">
              <ArrowRight size={14} />
            </button>
          </div>
          <p className="muted small">T+1 / T+5 Statutory refund clocks</p>
          <div style={{ marginTop: 8 }}>
            <span className="muted small">
              {disputes.length} active dispute(s) · ₹100/day penalty protection
            </span>
          </div>
        </section>
      </div>

      {/* 7. Safety & Kill Switch Widget */}
      <div className="widget-card-wrapper span-1">
        <section className="clay card widget-box" aria-label="Safety widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Power size={20} color={killSwitch.active ? '#E4372D' : '#12A07A'} />
              <h3>Safety & Kill switch</h3>
            </div>
            <button className="clay-btn round sm" onClick={() => onNavigate('kill')} aria-label="Go to Safety Controls">
              <ArrowRight size={14} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <span className={killSwitch.active ? 'err small' : 'pos small'}>
              {killSwitch.active ? 'Rails paused' : 'Active & protected'}
            </span>
            <button
              className="clay-btn sm"
              onClick={onToggleKillSwitch}
            >
              {killSwitch.active ? 'Resume' : 'Pause'}
            </button>
          </div>
        </section>
      </div>

      {/* 8. Balance Radar Widget */}
      <div className="widget-card-wrapper span-1">
        <section className="clay card widget-box" aria-label="Balance radar widget">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radar size={20} color="#0B2A5B" />
              <h3>Balance radar</h3>
            </div>
            <button className="clay-btn round sm" onClick={() => onNavigate('radar')} aria-label="Go to Radar Details">
              <ArrowRight size={14} />
            </button>
          </div>
          <p className="muted small">30-day forecast trajectory</p>
          <div style={{ marginTop: 8 }}>
            <span className="pos small" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldCheck size={14} /> Mandate buffers healthy
            </span>
          </div>
        </section>
      </div>

      {/* 9. Receive Money (QR) Widget */}
      <div className="widget-card-wrapper span-1">
        <ReceiveQrWidget upiId="user@citipay" displayName="CitiPay User" />
      </div>

      {/* 10. Recent Activity Widget */}
      <div className="widget-card-wrapper span-2">
        <HistoryLedgerScreen txns={txns} limit={4} />
      </div>
    </div>
  )
}
