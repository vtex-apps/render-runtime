/* global module */
import 'core-js/es6/symbol'
import 'core-js/fn/symbol/iterator'
import { prop } from 'ramda'
import { canUseDOM } from 'exenv'
import * as runtimeGlobals from './core/main'
import { createReactIntl } from './utils/reactIntl'

import { createCustomReactApollo } from './utils/reactApollo'
import { insertUncriticalLinkElements } from './utils/assets'

window.__RENDER_8_RUNTIME__ = { ...runtimeGlobals }

// compatibility
window.__RENDER_8_COMPONENTS__ =
  window.__RENDER_8_COMPONENTS__ || global.__RENDER_8_COMPONENTS__
window.__RENDER_8_HOT__ = window.__RENDER_8_HOT__ || global.__RENDER_8_HOT__
global.__RUNTIME__ = window.__RUNTIME__

let intlPolyfillPromise: Promise<void> = Promise.resolve()

if (window.IntlPolyfill) {
  window.IntlPolyfill.__disableRegExpRestore()
  if (!window.Intl) {
    window.Intl = window.IntlPolyfill
  } else if (!canUseDOM) {
    window.Intl.NumberFormat = window.IntlPolyfill.NumberFormat
    window.Intl.DateTimeFormat = window.IntlPolyfill.DateTimeFormat
  }
}
if (
  window.Intl &&
  canUseDOM &&
  (!window.Intl.PluralRules || !window.Intl.RelativeTimeFormat)
) {
  intlPolyfillPromise = import('./intl-polyfill').then(prop('default'))
}

if (canUseDOM) {
  const style = document.createElement('style')
  style.type = 'text/css'
  style.innerHTML = `.no-transitions * {
    -webkit-transition: none !important;
    -moz-transition: none !important;
    -ms-transition: none !important;
    -o-transition: none !important;
  }`
  document.getElementsByTagName('head')[0].appendChild(style)
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

if (!window.__RUNTIME__.amp) {
  window.ReactAMPHTML = window.ReactAMPHTMLHelpers =
    typeof Proxy !== 'undefined'
      ? new Proxy(
          {},
          {
            get: (_, key) => {
              if (key === '__esModule' || key === 'constructor') {
                return
              }

              const message = canUseDOM
                ? 'You can not render AMP components on client-side'
                : 'You must check runtime.amp to render AMP components'

              throw new Error(message)
            },
          }
        )
      : {} // IE11 users will not have a clear error in this case
}

if (window.ReactApollo) {
  window.ReactApollo = createCustomReactApollo()
}

if (window.ReactIntl) {
  window.ReactIntl = createReactIntl()
}

if (
  !window.__ERROR__ &&
  canUseDOM &&
  document.querySelector('style#critical')
) {
  window.__UNCRITICAL_PROMISE__ = new Promise(resolve => {
    window.addEventListener('load', () => {
      const {
        __RUNTIME__: { uncriticalStyleRefs },
      } = window
      if (uncriticalStyleRefs) {
        insertUncriticalLinkElements(uncriticalStyleRefs).finally(resolve)
      }
    })
  })
}

if (window.__RUNTIME__.start && !window.__ERROR__) {
  if (canUseDOM) {
    const contentLoadedPromise = new Promise(resolve =>
      window.addEventListener('DOMContentLoaded', resolve)
    )
    Promise.all([contentLoadedPromise, intlPolyfillPromise]).then(() => {
      setTimeout(() => {
        window?.performance?.mark('render-start')
        window.__RENDER_8_RUNTIME__.start()
        window?.performance?.mark('render-end')
        window?.performance?.measure(
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
