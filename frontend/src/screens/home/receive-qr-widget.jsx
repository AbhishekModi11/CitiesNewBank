import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { RotateCw, Share2, Download, QrCode } from 'lucide-react'

export default function ReceiveQrWidget({ user, initialAddress = 'payee@citi' }) {
  const [amount, setAmount] = useState('')
  const [address, setAddress] = useState(initialAddress)
  const [expiresAt, setExpiresAt] = useState(null)
  const [timeLeft, setTimeLeft] = useState('')

  const qrPayload = amount ? `upi://pay?pa=${address}&pn=${encodeURIComponent(user?.name ?? 'CitiPay User')}&am=${amount}&cu=INR` : `upi://pay?pa=${address}&pn=${encodeURIComponent(user?.name ?? 'CitiPay User')}&cu=INR`

  const handleGenerateAmount = (val) => {
    setAmount(val)
    if (val) {
      setExpiresAt(Date.now() + 15 * 60 * 1000)
    } else {
      setExpiresAt(null)
      setTimeLeft('')
    }
  }

  const handleRotate = () => {
    const randomHex = Math.random().toString(36).substring(2, 8)
    setAddress(`user-${randomHex}@citi`)
    if (amount) {
      setExpiresAt(Date.now() + 15 * 60 * 1000)
    }
  }

  useEffect(() => {
    if (!expiresAt) return
    const interval = setInterval(() => {
      const diff = expiresAt - Date.now()
      if (diff <= 0) {
        setTimeLeft('Expired')
        setAmount('')
        setExpiresAt(null)
      } else {
        const m = Math.floor(diff / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CitiPay UPI Address',
          text: `Pay ${user?.name ?? 'User'} via UPI: ${address}`,
          url: window.location.href,
        })
      } catch {}
    }
  }

  const handleDownload = () => {
    const svg = document.getElementById('receive-qr-svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `citipay-qr-${address}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="clay card receive-qr-widget" aria-label="Receive money QR">
      <div className="row spread" style={{ alignItems: 'center', marginBottom: 12 }}>
        <div className="row" style={{ alignItems: 'center', gap: 8 }}>
          <QrCode size={20} className="icon-success" />
          <h3 style={{ margin: 0 }}>Receive money</h3>
        </div>
        <button
          className="clay-btn compact"
          onClick={handleRotate}
          title="Rotate payment address"
          aria-label="Rotate payment address"
        >
          <RotateCw size={15} />
        </button>
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: '16px 0', background: 'var(--clay-surface)', borderRadius: 16 }}>
        <QRCodeSVG
          id="receive-qr-svg"
          value={qrPayload}
          size={180}
          level="M"
          includeMargin={true}
        />
        <p className="muted small" style={{ marginTop: 8, wordBreak: 'break-all' }}>{address}</p>
        {timeLeft && (
          <span className="badge warning" style={{ marginTop: 4 }}>
            Amount expires in: {timeLeft}
          </span>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <input
          className="field clay-in"
          type="number"
          placeholder="Optional amount (₹)"
          value={amount}
          onChange={(e) => handleGenerateAmount(e.target.value)}
          aria-label="QR requested value"
          style={{ width: '100%', marginBottom: 10 }}
        />
        <div className="row" style={{ gap: 8 }}>
          <button className="clay-btn grow" onClick={handleShare}>
            <Share2 size={16} style={{ marginRight: 6 }} /> Share
          </button>
          <button className="clay-btn grow" onClick={handleDownload}>
            <Download size={16} style={{ marginRight: 6 }} /> Download
          </button>
        </div>
      </div>
    </section>
  )
}
