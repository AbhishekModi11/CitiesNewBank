import { useEffect, useRef } from 'react'

export default function Modal({ open, onClose, title, children }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    const previouslyFocused = document.activeElement
    const focusable = () =>
      [...(ref.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [])]
        .filter((el) => !el.disabled)
    focusable()[0]?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="clay modal" ref={ref} onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
