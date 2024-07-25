/* global module */
import './o11y/instrument'
import 'core-js/es6/symbol'
import 'core-js/fn/symbol/iterator'
import { canUseDOM } from 'exenv'
import * as runtimeGlobals from './core/main'

import { polyfillIntl } from './start/intl'
import { addAMPProxy } from './start/amp'
import { patchLibs } from './start/patchLibs'
import { registerRuntimeGlobals } from './start/register'
import { loadRuntimeJSONs } from './start/runtime'
import { hydrateUncriticalStyles } from './start/styles'

function performanceMark(...args: Parameters<typeof window.performance.mark>) {
  if (
    typeof window === 'undefined' ||
    !(typeof window?.performance?.mark === 'function')
  ) {
    return
  }
  window.performance.mark(...args)
}

const uncriticalStylesPromise = hydrateUncriticalStyles()
performanceMark('uncritical-styles-start')
uncriticalStylesPromise.then(() => {
  performanceMark('uncritical-styles-end')
})

performanceMark('intl-polyfill-start')
const intlPolyfillPromise = polyfillIntl()
intlPolyfillPromise.then(() => {
  performanceMark('intl-polyfill-end')
})

registerRuntimeGlobals(runtimeGlobals)
addAMPProxy(window.__RUNTIME__)
patchLibs()

export const renderReadyPromise: Promise<any> = canUseDOM
  ? (function () {
      const contentLoadedPromise = new Promise((resolve) => {
        window.addEventListener('DOMContentLoaded', resolve)
        if (window.__DOM_READY__) {
          resolve()
        }
      })

      contentLoadedPromise.then(() => {
        performanceMark('content-loaded-promise-resolved')
      })

      const scriptsLoadedPromise = new Promise((resolve) => {
        if (typeof window.__ASYNC_SCRIPTS_READY__ === 'undefined') {
          return resolve()
        }

        window.addEventListener('asyncScriptsReady', resolve)
        if (window.__ASYNC_SCRIPTS_READY__) {
          resolve()
        }
      })

      return Promise.all([
        contentLoadedPromise,
        intlPolyfillPromise,
        scriptsLoadedPromise,
        uncriticalStylesPromise,
      ])
    })()
  : Promise.resolve()

function start() {
  global.__RUNTIME__ = window.__RUNTIME__
  if (window.__RUNTIME__.start && !window.__ERROR__) {
    if (canUseDOM) {
      renderReadyPromise.then(() => {
        setTimeout(() => {
          performanceMark('render-start')
          window.__RENDER_8_RUNTIME__.start()
          performanceMark('render-end')
          window?.performance?.measure?.(
            '[VTEX IO] Rendering/Hydration',
            'render-start',
            'render-end'
          )
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

export * from './core/main'
