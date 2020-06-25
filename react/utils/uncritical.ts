const debugCriticalCSS = window.__RUNTIME__.query?.__debugCriticalCSS
const UNCRITICAL_ID = 'uncritical_style'
const loadedStyles: Set<string | null> = new Set()
let totalStylesCount = 0
let stylesHydrated = false

const log = (...args: any) => {
  if (debugCriticalCSS) {
    console.log('[critical]:', ...args)
  }
}

const hydrateStyle = (id: string | null) => {
  const element = id && document.getElementById(id)
  if (element) {
    log('hydrating', id)
    element.setAttribute('rel', 'stylesheet')
    element.setAttribute('type', 'text/css')
    element.removeAttribute('as')
  }
}

const clearCritical = () => {
  const critical = document.querySelector('style#critical')
  if (critical?.parentElement) {
    log('cleaning style#critical')
    critical.remove()
  }
}

const cmp = (id1: string | null, id2: string | null) => {
  if (!id1) {
    return -1
  }
  if (!id2) {
    return 1
  }
  const replacer = `${UNCRITICAL_ID}_`
  const a = id1.replace(replacer, '')
  const b = id2.replace(replacer, '')
  return Number(a) - Number(b)
}

const loadedStylesToArray = () => Array.from(loadedStyles).sort(cmp)

const createStepUncritical = () => {
  let it = 0
  return () => {
    if (it === totalStylesCount) {
      log('Uncritical has finished being applied.')
      return
    }
    const uncritical = loadedStylesToArray()[it]
    if (!uncritical) {
      log('All uncritical styles applied. Cleaning critical styles.')
      clearCritical()
      return
    }
    log('Applying uncritical style', document.getElementById(uncritical))
    hydrateStyle(uncritical)
    it++
  }
}

const applyUncritical = () => {
  loadedStylesToArray().forEach(hydrateStyle)
  stylesHydrated = true
}

const registerLoadedStyle = (
  styleId: string,
  status: 'loaded' | 'error' = 'error'
) => () => {
  const id = status === 'loaded' ? styleId : null
  // sometimes the id is loaded twice. Let's just register it once
  if (loadedStyles.has(id)) {
    return
  }
  loadedStyles.add(id)
  if (stylesHydrated === true) {
    log('Late hydration', id)
    hydrateStyle(id)
  } else if (
    loadedStyles.size === totalStylesCount &&
    debugCriticalCSS !== 'manual'
  ) {
    log('Applying critical for', ...loadedStyles)
    applyUncritical()
    log('UnCritical Hydration Finished !', {
      hydrated: totalStylesCount,
    })
  }
}

const createUncriticalLink = (ref: StyleRef, index: number) => {
  if (!ref) {
    return
  }
  const { media, path: href } = ref
  const id = `${UNCRITICAL_ID}_${index}`

  const link = document.createElement('link')

  if (media) {
    link.setAttribute('media', media)
  }

  link.setAttribute('id', id)
  link.setAttribute('className', 'uncritical')
  link.setAttribute('rel', 'preload')
  link.setAttribute('as', 'style')
  link.setAttribute('href', href)
  link.addEventListener('load', registerLoadedStyle(id, 'loaded'))
  link.addEventListener('error', registerLoadedStyle(id, 'error'))

  const shouldAppend = !media || matchMedia(media).matches

  if (shouldAppend) {
    totalStylesCount += 1
    document.head.appendChild(link)
  }
}

export const resolveUncriticalPromise = () => {
  window.__UNCRITICAL_PROMISE__ = new Promise((resolve) => {
    const {
      __RUNTIME__: { uncriticalStyleRefs },
    } = window
    const criticalElement = document.querySelector('style#critical')

    if (!uncriticalStyleRefs || !criticalElement) {
      return resolve()
    }

    const { base = [], overrides = [] } = uncriticalStyleRefs
    const uncriticalStyles = [...base, ...overrides]

    uncriticalStyles.forEach(createUncriticalLink)

    if (debugCriticalCSS === 'manual') {
      ;(window as any).applyUncritical = applyUncritical
      ;(window as any).clearCritical = clearCritical
      ;(window as any).stepUncritical = createStepUncritical()

      log(
        `Run the following functions on the console to manually apply uncritical CSS:
          - applyUncritical()
          - stepUncritical()
          - clearCritical()
        `
      )
    }

    return resolve()
  })
  return window.__UNCRITICAL_PROMISE__
}
