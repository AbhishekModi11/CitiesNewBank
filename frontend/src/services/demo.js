export const isDemoMode = () => {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('demo') === '1'
}
