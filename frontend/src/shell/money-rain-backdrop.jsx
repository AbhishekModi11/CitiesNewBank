import { useEffect, useState } from 'react'

const SYMBOLS = ['₹', '₹', '₹', '₹', '₹', '$', '€', '£']

export default function MoneyRainBackdrop() {
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const handleVisibility = () => {
      setIsPaused(document.hidden)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return (
    <div
      className={`bg money-rain ${isPaused ? 'paused' : ''}`}
      aria-hidden="true"
    >
      <span className="blob b1" />
      <span className="blob b2" />
      <span className="blob b3" />
      {Array.from({ length: 18 }).map((_, i) => {
        const symbol = SYMBOLS[i % SYMBOLS.length]
        const left = `${(i * 19 + 7) % 95}%`
        const delay = `${(i * 1.3) % 8}s`
        const duration = `${12 + (i % 6) * 3}s`
        return (
          <span
            key={i}
            className="floating-money-symbol"
            style={{
              left,
              animationDelay: delay,
              animationDuration: duration,
              opacity: 0.12 + ((i % 4) * 0.03),
            }}
          >
            {symbol}
          </span>
        )
      })}
    </div>
  )
}