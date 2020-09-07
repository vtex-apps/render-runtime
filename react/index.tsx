/* global module */
import 'core-js/es6/symbol'
import 'core-js/fn/symbol/iterator'
import { canUseDOM } from 'exenv'
import * as runtimeGlobals from './core/main'

import { polyfillIntl } from './start/intl'
import { addAMPProxy } from './start/amp'
import { patchLibs } from './start/patchLibs'
import { registerRuntimeGlobals } from './start/register'
import { createUncriticalPromise } from './start/uncritical'
import { loadRuntimeJSONs } from './start/runtime'
import { hydrateUncriticalStyles } from './start/styles'

const uncriticalStylesPromise = hydrateUncriticalStyles()
const intlPolyfillPromise = polyfillIntl()
registerRuntimeGlobals(runtimeGlobals)
addAMPProxy(window.__RUNTIME__)
patchLibs()

function start() {
  global.__RUNTIME__ = window.__RUNTIME__
  if (window.__RUNTIME__.start && !window.__ERROR__) {
    if (canUseDOM) {
      const contentLoadedPromise = new Promise((resolve) => {
        window.addEventListener('DOMContentLoaded', resolve)
        if (window.__DOM_READY__) {
          resolve()
        }
      })

      const resolveUncriticalPromise = createUncriticalPromise(
        window.__RUNTIME__
      )
      Promise.all([
        contentLoadedPromise,
        intlPolyfillPromise,
        uncriticalStylesPromise,
      ]).then(() => {
        setTimeout(() => {
          window?.performance?.mark?.('render-start')
          window.__RENDER_8_RUNTIME__.start()
          window?.performance?.mark?.('render-end')
          window?.performance?.measure?.(
            '[VTEX IO] Rendering/Hydration',
            'render-start',
            'render-end'
          )
          resolveUncriticalPromise()
        }, 1)
      })
    } else {
      window.__RENDER_8_RUNTIME__.start()
    }
  }
}

if (module.hot) {
  module.hot.accept('./core/main', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const hotGlobals = require('./core/main')
    window.__RENDER_8_RUNTIME__.ExtensionContainer =
      hotGlobals.ExtensionContainer
    window.__RENDER_8_RUNTIME__.ExtensionPoint = hotGlobals.ExtensionPoint
    window.__RENDER_8_RUNTIME__.LayoutContainer = hotGlobals.LayoutContainer
    window.__RENDER_8_RUNTIME__.Link = hotGlobals.Link
    window.__RENDER_8_RUNTIME__.Loading = hotGlobals.Loading
    window.__RENDER_8_RUNTIME__.buildCacheLocator = hotGlobals.buildCacheLocator
    runtimeGlobals.start()
  })
}

if (!canUseDOM) {
  start()
} else {
  loadRuntimeJSONs().then(() => start())
}
