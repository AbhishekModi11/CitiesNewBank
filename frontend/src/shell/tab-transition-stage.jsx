import { useEffect, useRef, useState } from 'react'

const TAB_INDEX_MAP = {
  home: 0,
  history: 1,
  assistant: 2,
  balance: 3,
  profile: 4,
  pay: 0,
  tracker: 0,
  bank: 0,
  autopay: 0,
  scam: 0,
  kill: 0,
  family: 0,
  disputes: 0,
  radar: 3,
}

export default function TabTransitionStage({ currentView, children }) {
  const prevViewRef = useRef(currentView)
  const [animationClass, setAnimationClass] = useState('')

  useEffect(() => {
    const prev = prevViewRef.current
    if (prev === currentView) return

    const prevIndex = TAB_INDEX_MAP[prev] ?? 0
    const currIndex = TAB_INDEX_MAP[currentView] ?? 0
    const direction = currIndex >= prevIndex ? 'slide-from-right' : 'slide-from-left'

    setAnimationClass(direction)
    prevViewRef.current = currentView

    const timer = setTimeout(() => {
      setAnimationClass('')
    }, 320)

    return () => clearTimeout(timer)
  }, [currentView])

  return (
    <div className={`tab-transition-stage ${animationClass}`}>
      {children}
    </div>
  )
}
