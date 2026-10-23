import {
  Home,
  Send,
  ListChecks,
  Shield,
  Bot,
  Users,
  Scale,
  Power,
  Landmark,
  History as HistoryIcon,
  User,
} from 'lucide-react'

const DOCK_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'pay', label: 'Pay', icon: Send },
  { id: 'tracker', label: 'Tracker', icon: ListChecks },
  { id: 'bank', label: 'Bank', icon: Shield },
  { id: 'kill', label: 'Kill switch', icon: Power },
  { id: 'assistant', label: 'Assistant', icon: Bot, raised: true },
  { id: 'family', label: 'Family', icon: Users },
  { id: 'disputes', label: 'Disputes', icon: Scale },
  { id: 'balance', label: 'Balance', icon: Landmark },
  { id: 'history', label: 'History', icon: HistoryIcon },
  { id: 'profile', label: 'Profile', icon: User },
]

export default function CurvedTabDock({ view, setView }) {
  return (
    <nav className="curved-tab-dock clay" aria-label="Primary navigation">
      <div className="tab-dock-container">
        {DOCK_ITEMS.map(({ id, label, icon: Icon, raised }) => {
          const isActive = view === id
          return (
            <button
              key={id}
              className={`dock-tab-btn ${isActive ? 'active' : ''} ${raised ? 'raised-center' : ''}`}
              onClick={() => setView(id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
            >
              <div className="tab-icon-wrapper">
                <Icon size={raised ? 24 : 18} />
              </div>
              <span className="tab-label">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
