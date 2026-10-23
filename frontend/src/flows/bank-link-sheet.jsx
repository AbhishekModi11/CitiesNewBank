import { useState } from 'react'
import { Landmark, ShieldCheck, AlertCircle } from 'lucide-react'
import ModalDialog from '../components/modal-dialog.jsx'

const AVAILABLE_BANKS = [
  { id: 'citi', name: 'Citi Bank', code: 'CITI' },
  { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
  { id: 'icici', name: 'ICICI Bank', code: 'ICIC' },
  { id: 'sbi', name: 'State Bank of India', code: 'SBIN' },
  { id: 'axis', name: 'Axis Bank', code: 'UTIB' },
]

export default function BankLinkSheet({ open, onClose, onLinkSuccess, existingAccounts = [] }) {
  const [selectedBank, setSelectedBank] = useState(AVAILABLE_BANKS[0].id)
  const [last4, setLast4] = useState('')
  const [step, setStep] = useState('select') // 'select' | 'verify' | 'success'
  const [error, setError] = useState('')

  if (!open) return null

  const handleSimulatedVerify = () => {
    if (!/^\d{4}$/.test(last4)) {
      setError('Please enter exactly 4 digits')
      return
    }
    setError('')
    setStep('verify')

    setTimeout(() => {
      const bankObj = AVAILABLE_BANKS.find((b) => b.id === selectedBank) || AVAILABLE_BANKS[0]
      const newAccount = {
        id: `acc_${Date.now()}`,
        bank: bankObj.name,
        last4,
        balance: 25000,
        isPrimary: existingAccounts.length === 0,
        linkedAt: Date.now(),
      }
      setStep('success')
      setTimeout(() => {
        onLinkSuccess(newAccount)
        onClose()
        setStep('select')
        setLast4('')
      }, 700)
    }, 600)
  }

  return (
    <ModalDialog open={open} onClose={onClose} title="Link bank account">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p className="muted small">
          Link a bank account for UPI rails. Real account numbers and UPI PINs are never stored or collected.
        </p>

        {step === 'select' && (
          <>
            <label>
              <span className="muted small">Choose your bank</span>
              <select
                className="field clay-in"
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                style={{ width: '100%', marginTop: 6 }}
                aria-label="Bank selection"
              >
                {AVAILABLE_BANKS.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span className="muted small">Account number (last 4 digits only)</span>
              <input
                className="field clay-in"
                inputMode="numeric"
                maxLength={4}
                placeholder="4421"
                value={last4}
                onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))}
                style={{ width: '100%', marginTop: 6 }}
                aria-label="Last 4 digits"
              />
            </label>

            {error && (
              <p className="err small" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertCircle size={14} /> {error}
              </p>
            )}

            <button
              className="clay-btn primary grow"
              onClick={handleSimulatedVerify}
              style={{ marginTop: 8 }}
            >
              Verify with bank
            </button>
          </>
        )}

        {step === 'verify' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="spin" style={{ display: 'inline-block', marginBottom: 12 }}>
              <Landmark size={32} color="#0A6EC9" />
            </div>
            <p>Simulating secure bank verification...</p>
            <p className="muted small">Connecting to simulated UPI provider</p>
          </div>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <ShieldCheck size={36} color="#12A07A" style={{ marginBottom: 12 }} />
            <p className="pos" style={{ fontWeight: 600 }}>Account linked successfully</p>
            <p className="muted small">Ready for payments and balance inquiries</p>
          </div>
        )}
      </div>
    </ModalDialog>
  )
}
