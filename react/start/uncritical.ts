import { fetchUncriticalStyles, UncriticalStyle } from '../utils/assets'

export const createUncriticalPromise = (runtime: RenderRuntime) => {
  const { uncriticalStyleRefs } = runtime
  const criticalElement = document.querySelector('style#critical')
  let resolve = () => {}

  if (!uncriticalStyleRefs || !criticalElement) {
    return resolve
  }

  window.__UNCRITICAL_PROMISE__ = new Promise<void>((r) => {
    resolve = r
  })
    .then(() => {
      const { base = [], overrides = [] } = uncriticalStyleRefs
      return fetchUncriticalStyles([...base, ...overrides])
    })
    .then((uncriticalStyles) => {
      if (!uncriticalStyles) {
        console.error('Missing lazy links')
        return
      }

      const debugCriticalCSS = runtime.query?.__debugCriticalCSS

      const createUncriticalStyle = (uncriticalStyle: UncriticalStyle) => {
        if (!uncriticalStyle) {
          return
        }
        const style = document.createElement('style')

        style.id = uncriticalStyle.id ?? ''
        style.className = `uncritical ${uncriticalStyle.className ?? ''}`
        style.media = uncriticalStyle.media
        style.innerHTML = uncriticalStyle.body
        style.setAttribute('data-href', uncriticalStyle.href)

        document.head.appendChild(style)
      }

      const clearCritical = () => {
        if (criticalElement.parentElement) {
          criticalElement.remove()
        }
      }

      const applyUncritical = () => {
        uncriticalStyles.forEach(createUncriticalStyle)
        clearCritical()
      }

      /** Doesn't apply uncritical CSS automatically--exposes functions
       * to the window to manually do it, for debugging purposes
       */
      if (debugCriticalCSS === 'manual') {
        ;(window as any).applyUncritical = applyUncritical
        ;(window as any).clearCritical = clearCritical

        let currentUncritical = 0
        ;(window as any).stepUncritical = () => {
          if (currentUncritical === -1) {
            console.log('Uncritical has finished being applied.')
          }
          const current = uncriticalStyles[currentUncritical]
          if (!current) {
            console.log(
              'All uncritical styles applied. Cleaning critical styles.'
            )
            clearCritical()
            currentUncritical = -1
          }
          console.log('Applying uncritical style', current)
          createUncriticalStyle(current)
          currentUncritical++
        }

        console.log(
          `Run the following functions on the console to manually apply uncritical CSS:
            - applyUncritical()
            - stepUncritical()
            - clearCritical()
          `
        )
      } else {
        applyUncritical()
      }
    })

  return resolve
}
