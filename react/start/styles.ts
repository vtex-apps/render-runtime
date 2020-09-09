import { canUseDOM } from 'exenv'

export const hydrateUncriticalStyles = async () => {
  if (
    canUseDOM &&
    typeof window.__CRITICAL__RAISE_UNCRITICAL_EVENT__ === 'function'
  ) {
    window.__CRITICAL__RAISE_UNCRITICAL_EVENT__()
    return window.__CRITICAL__UNCRITICAL_APPLIED__
  }
}
