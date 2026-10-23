import { useEffect, useState } from 'react'
import { Bell, Landmark } from 'lucide-react'
import MoneyRainBackdrop from './money-rain-backdrop.jsx'
import CurvedTabDock from './curved-tab-dock.jsx'
import TabTransitionStage from './tab-transition-stage.jsx'
import AssistantBottomDock from './assistant-bottom-dock.jsx'
import AssistantPanel from './assistant-panel.jsx'

// Screens
import HomeWidgetBoard from '../screens/home/home-widget-board.jsx'
import PayFlowScreen from '../screens/payments/pay-flow-screen.jsx'
import PaymentTrackerScreen from '../screens/payments/payment-tracker-screen.jsx'
import BankShieldScreen from '../screens/bank/bank-shield-screen.jsx'
import AutopayGuardScreen from '../screens/autopay/autopay-guard-screen.jsx'
import ScamCoolingScreen from '../screens/scam/scam-cooling-screen.jsx'
import KillSwitchScreen from '../screens/safety/kill-switch-screen.jsx'
import FamilyCircleScreen from '../screens/family/family-circle-screen.jsx'
import DisputesRefundScreen from '../screens/disputes/disputes-refund-screen.jsx'
import BalanceRadarScreen from '../screens/radar/balance-radar-screen.jsx'
import AssistantGuardScreen from '../screens/assistant/assistant-guard-screen.jsx'
import BalanceCheckScreen from '../screens/balance/balance-check-screen.jsx'
import HistoryLedgerScreen from '../screens/history/history-ledger-screen.jsx'
import ProfileViewScreen from '../screens/profile/profile-view-screen.jsx'
import AuthGateFlow from '../screens/auth/auth-gate-flow.jsx'

// Flows
import BankLinkSheet from '../flows/bank-link-sheet.jsx'

// Data & Services
import { accounts as seedAccounts, contacts, seedTxns, seedPayments, seedFamily, seedDisputes } from '../data/sample-seed-state.js'
import { isDemoMode } from '../services/demo.js'
import { createPaymentRequest, processQueue } from '../services/payments.js'
import { enqueueOfflinePayment, listOfflinePayments, flushOfflinePayments } from '../services/offlineQueue.js'
import { familyApprove, familyDecline } from '../services/family.js'
import { raiseDispute as createDispute } from '../services/disputes.js'
import { activateKillSwitch, deactivateKillSwitch } from '../../../middleware/index.js'

// Icons for desktop sidebar
import {
  Home,
  Send,
  ListChecks,
  Shield,
  Repeat,
  ShieldAlert,
  Power,
  Users,
  Scale,
  Radar,
  Bot,
  User,
  History as HistoryIcon,
} from 'lucide-react'

const sidebarItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'pay', label: 'Pay', icon: Send },
  { id: 'tracker', label: 'Tracker', icon: ListChecks },
  { id: 'bank', label: 'Bank', icon: Shield },
  { id: 'autopay', label: 'Autopay', icon: Repeat },
  { id: 'scam', label: 'Scam', icon: ShieldAlert },
  { id: 'kill', label: 'Kill switch', icon: Power },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'disputes', label: 'Disputes', icon: Scale },
  { id: 'radar', label: 'Radar', icon: Radar },
  { id: 'assistant', label: 'Assistant', icon: Bot },
  { id: 'balance', label: 'Balance', icon: Landmark },
  { id: 'history', label: 'History', icon: HistoryIcon },
  { id: 'profile', label: 'Profile', icon: User },
]

const richest = (list) => (list.length ? [...list].sort((a, b) => b.balance - a.balance)[0].id : null)

export default function App() {
  const [view, setView] = useState('home')
  const [accounts, setAccounts] = useState(seedAccounts)
  const [selected, setSelected] = useState(() => richest(seedAccounts))
  const [txns, setTxns] = useState(seedTxns)
  const [payments, setPayments] = useState(seedPayments)
  const [family] = useState(seedFamily)
  const [disputes, setDisputes] = useState(seedDisputes)
  const [killSwitch, setKillSwitch] = useState({ active: false, activatedAt: null, lockedUntil: null, initiatedBy: null })
  const [bankUp, setBankUp] = useState(true)
  const [clockOffset, setClockOffset] = useState(0)
  const [toast, setToast] = useState('')
  const [authStage, setAuthStage] = useState('mobile')
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const [syncing, setSyncing] = useState(false)
  const [bankLinkOpen, setBankLinkOpen] = useState(false)
  const [assistantPanelOpen, setAssistantPanelOpen] = useState(false)

  // Theme support
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('citipay-theme') || 'light'
    }
    return 'light'
  })

  const setTheme = (nextTheme) => {
    setThemeState(nextTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('citipay-theme', nextTheme)
      if (nextTheme === 'light') {
        document.documentElement.removeAttribute('data-theme')
      } else {
        document.documentElement.setAttribute('data-theme', nextTheme)
      }
    }
  }

  useEffect(() => {
    if (theme && theme !== 'light') {
      document.documentElement.setAttribute('data-theme', theme)
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [theme])

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  useEffect(() => {
    if (!online) return
    let active = true
    ;(async () => {
      const queued = await listOfflinePayments()
      if (!active || queued.length === 0) return
      setSyncing(true)
      try {
        await flushOfflinePayments(async () => {})
        setPayments((prev) => {
          const result = processQueue({
            payments: prev,
            accounts,
            bankUp: true,
            killSwitch,
            now: now(),
          })
          setAccounts(result.accounts)
          appendCompleted(result.completed)
          return result.payments
        })
        showToast('Offline payments synced')
      } finally {
        if (active) setSyncing(false)
      }
    })()
    return () => { active = false }
  }, [online])

  const demo = isDemoMode()
  if (authStage !== 'home') {
    return (
      <main className="app" style={{ display: 'grid', placeItems: 'center' }}>
        <AuthGateFlow onAuthenticated={() => setAuthStage('home')} />
      </main>
    )
  }

  const now = () => Date.now() + clockOffset
  const account = accounts.find((a) => a.id === selected) ?? accounts[0]

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 2800)
  }

  const appendCompleted = (completed) => {
    if (completed.length) {
      setTxns((prev) => {
        const existingIds = new Set(prev.map((t) => t.id))
        const unique = completed.filter((p) => !existingIds.has(p.id)).map((p) => ({
          id: p.id,
          name: p.payee,
          amount: -p.amount,
          when: 'Just now',
          status: 'completed',
          fresh: true,
        }))
        return [...unique, ...prev]
      })
    }
  }

  const runQueue = (nextBankUp, nextOffset) => {
    const bank = nextBankUp ?? bankUp
    const offset = nextOffset ?? clockOffset
    const timestamp = Date.now() + offset
    const result = processQueue({ payments, accounts, bankUp: bank, killSwitch, now: timestamp })
    setPayments(result.payments)
    setAccounts(result.accounts)
    appendCompleted(result.completed)
  }

  const handlePay = async (name, amount, accountId) => {
    const chosenAccount = accounts.find((a) => a.id === accountId) ?? account
    if (!chosenAccount) {
      setBankLinkOpen(true)
      return
    }
    const context = {
      knownPayees: contacts,
      recentPayments: payments.map((p) => ({ payee: p.payee, amount: p.amount, at: p.createdAt })),
      killSwitch,
    }
    const { payment, evaluation } = createPaymentRequest({
      payee: name,
      amount,
      accountId: chosenAccount.id,
      account: chosenAccount,
      context,
      now: now(),
    })
    if (!navigator.onLine) {
      await enqueueOfflinePayment({ idempotencyKey: payment.id, payment, createdAt: payment.createdAt })
      setPayments([payment, ...payments])
      showToast('Payment queued for bank recovery')
      return
    }
    const updatedPayments = [payment, ...payments]
    let nextPayments = updatedPayments
    let nextAccounts = accounts

    if (evaluation.outcome !== 'awaiting_approval' && evaluation.outcome !== 'blocked') {
      const result = processQueue({ payments: updatedPayments, accounts, bankUp, killSwitch, now: now() })
      nextPayments = result.payments
      nextAccounts = result.accounts
      appendCompleted(result.completed)
    }

    setPayments(nextPayments)
    setAccounts(nextAccounts)

    if (evaluation.outcome === 'blocked') showToast('Payment blocked by shield')
    else if (evaluation.outcome === 'awaiting_approval') showToast('Approval requested')
    else if (bankUp) showToast(`Queued for settlement to ${name}`)
    else showToast('Payment queued for bank recovery')
  }

  const cancelPayment = (id) => {
    setPayments((prev) => prev.map((p) => (p.id === id ? { ...p, status: 'cancelled', updatedAt: now() } : p)))
  }

  const toggleBank = () => {
    const next = !bankUp
    const timestamp = now()
    const result = processQueue({ payments, accounts, bankUp: next, killSwitch, now: timestamp })
    setBankUp(next)
    setPayments(result.payments)
    setAccounts(result.accounts)
    appendCompleted(result.completed)
    showToast(next ? 'Bank restored' : 'Bank offline')
  }

  const timeSkip = () => {
    const nextOffset = clockOffset + 3600000
    setClockOffset(nextOffset)
    const timestamp = Date.now() + nextOffset
    const result = processQueue({ payments, accounts, bankUp: bankUp, killSwitch, now: timestamp })
    setPayments(result.payments)
    setAccounts(result.accounts)
    appendCompleted(result.completed)
    showToast('Time advanced one hour')
  }

  const approvePayment = (id) => {
    const updated = payments.map((p) => {
      if (p.id !== id) return p
      const approved = familyApprove(p, 'm1', now())
      return { ...approved, status: 'queued', updatedAt: now(), reason: 'Approved by family' }
    })
    const result = processQueue({ payments: updated, accounts, bankUp, killSwitch, now: now() })
    setPayments(result.payments)
    setAccounts(result.accounts)
    appendCompleted(result.completed)
    showToast('Payment approved')
  }

  const declinePayment = (id) => {
    setPayments((prev) => prev.map((p) => (p.id === id ? familyDecline(p, 'm1', now()) : p)))
    showToast('Payment declined')
  }

  const toggleKillSwitch = () => {
    if (killSwitch.active) {
      setKillSwitch(deactivateKillSwitch(killSwitch, now()))
      showToast('Payments resumed')
    } else {
      setKillSwitch(activateKillSwitch(killSwitch, now()))
      showToast('Payments paused')
    }
  }

  const toggleMandate = (accountId) => {
    setAccounts((prev) => prev.map((a) => (
      a.id === accountId && a.mandate
        ? { ...a, mandate: { ...a.mandate, paused: !a.mandate.paused } }
        : a
    )))
  }

  const raiseDispute = (payment, reason) => {
    setDisputes((prev) => [createDispute({ payment, reason, now: now() }), ...prev])
    showToast('Dispute raised')
  }

  const handleLinkBankSuccess = (newAcc) => {
    setAccounts((prev) => [...prev, newAcc])
    setSelected(newAcc.id)
    showToast(`${newAcc.bank} account linked`)
  }

  const handleSetPrimaryBank = (accId) => {
    setAccounts((prev) => prev.map((a) => ({ ...a, isPrimary: a.id === accId })))
    showToast('Primary bank account updated')
  }

  const handleRemoveBank = (accId) => {
    const hasPending = payments.some((p) => p.accountId === accId && (p.status === 'queued' || p.status === 'cooling'))
    if (hasPending) {
      showToast('Cannot remove account with pending payments')
      return
    }
    setAccounts((prev) => prev.filter((a) => a.id !== accId))
    showToast('Bank account removed')
  }

  const appState = { payments, accounts, txns, bankUp, killSwitch }

  return (
    <div className="app">
      <MoneyRainBackdrop />

      {/* Desktop Curved Rail */}
      <nav className="side clay" aria-label="Primary navigation">
        <div className="logo">
          <Landmark size={24} />
          <span>CitiPay</span>
        </div>
        {sidebarItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`nav ${view === id ? 'on' : ''}`}
            onClick={() => setView(id)}
            aria-current={view === id ? 'page' : undefined}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <main className="main">
        <header className="top">
          <div>
            <p className="muted small">{demo ? 'Demo mode' : 'CitiPay'}{online ? '' : ' · Offline'}{syncing ? ' · Syncing' : ''}</p>
            <h1>{view === 'home' ? 'Home' : view.charAt(0).toUpperCase() + view.slice(1)}</h1>
          </div>
          <div className="top-actions">
            <button className="clay-btn round" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <div className="avatar" onClick={() => setView('profile')} style={{ cursor: 'pointer' }}>
              C
            </div>
          </div>
        </header>

        <TabTransitionStage currentView={view}>
          {view === 'home' && (
            <HomeWidgetBoard
              accounts={accounts}
              selected={selected}
              setSelected={setSelected}
              account={account}
              onPay={handlePay}
              txns={txns}
              payments={payments}
              family={family}
              disputes={disputes}
              killSwitch={killSwitch}
              onNavigate={setView}
              onOpenAssistant={() => setAssistantPanelOpen(true)}
              onToggleKillSwitch={toggleKillSwitch}
            />
          )}
          {view === 'pay' && (
            <PayFlowScreen
              account={account}
              accounts={accounts}
              selected={selected}
              setSelected={setSelected}
              onPay={handlePay}
              onOpenBankLink={() => setBankLinkOpen(true)}
            />
          )}
          {view === 'tracker' && (
            <PaymentTrackerScreen payments={payments} onCancel={cancelPayment} />
          )}
          {view === 'bank' && (
            <BankShieldScreen
              bankUp={bankUp}
              onToggleBank={toggleBank}
              payments={payments}
              onProcess={() => runQueue(bankUp, clockOffset)}
              onTimeSkip={timeSkip}
            />
          )}
          {view === 'autopay' && (
            <AutopayGuardScreen accounts={accounts} onToggleMandate={toggleMandate} />
          )}
          {view === 'scam' && (
            <ScamCoolingScreen payments={payments} onCancel={cancelPayment} />
          )}
          {view === 'kill' && (
            <KillSwitchScreen killSwitch={killSwitch} onToggle={toggleKillSwitch} />
          )}
          {view === 'family' && (
            <FamilyCircleScreen
              family={family}
              payments={payments}
              onApprove={approvePayment}
              onDecline={declinePayment}
            />
          )}
          {view === 'disputes' && (
            <DisputesRefundScreen
              payments={payments}
              disputes={disputes}
              onRaise={raiseDispute}
            />
          )}
          {view === 'radar' && (
            <BalanceRadarScreen accounts={accounts} />
          )}
          {view === 'assistant' && (
            <AssistantGuardScreen appState={appState} />
          )}
          {view === 'balance' && (
            <BalanceCheckScreen
              accounts={accounts}
              onOpenBankLink={() => setBankLinkOpen(true)}
              onSetPrimary={handleSetPrimaryBank}
            />
          )}
          {view === 'history' && (
            <HistoryLedgerScreen txns={txns} />
          )}
          {view === 'profile' && (
            <ProfileViewScreen
              accounts={accounts}
              onOpenBankLink={() => setBankLinkOpen(true)}
              onSetPrimary={handleSetPrimaryBank}
              onRemoveBank={handleRemoveBank}
              theme={theme}
              setTheme={setTheme}
            />
          )}
        </TabTransitionStage>
      </main>

      {/* Mobile Curved Tab Dock */}
      <CurvedTabDock view={view} setView={setView} />

      {/* Floating Bottom Assistant Dock */}
      <AssistantBottomDock currentView={view} onOpen={() => setAssistantPanelOpen(true)} />

      {/* Side Panel / Bottom Sheet Assistant */}
      <AssistantPanel
        open={assistantPanelOpen}
        onClose={() => setAssistantPanelOpen(false)}
        appState={appState}
      />

      {/* Bank Link Sheet Modal */}
      <BankLinkSheet
        open={bankLinkOpen}
        onClose={() => setBankLinkOpen(false)}
        onLinkSuccess={handleLinkBankSuccess}
        existingAccounts={accounts}
      />

      {toast && <div className="clay toast" role="status">{toast}</div>}
    </div>
  )
}
