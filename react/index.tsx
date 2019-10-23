/* global module */
import 'core-js/es6/symbol'
import 'core-js/fn/symbol/iterator'
import * as Sentry from '@sentry/browser'
import { canUseDOM } from 'exenv'
import * as runtimeGlobals from './core/main'

window.__RENDER_8_RUNTIME__ = { ...runtimeGlobals }

// compatibility
window.__RENDER_8_COMPONENTS__ =
  window.__RENDER_8_COMPONENTS__ || global.__RENDER_8_COMPONENTS__
window.__RENDER_8_HOT__ = window.__RENDER_8_HOT__ || global.__RENDER_8_HOT__
global.__RUNTIME__ = window.__RUNTIME__

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

const sentryDSN = 'https://2fac72ea180d48ae9bf1dbb3104b4000@sentry.io/1292015'

if (canUseDOM && window.__RUNTIME__.production) {
  const { version = '' } = window.__RUNTIME__.runtimeMeta || {}
  Sentry.init({
    beforeSend: (event: Sentry.SentryEvent) =>
      event.tags && event.tags.component ? event : null,
    dsn: sentryDSN,
    environment: canUseDOM ? 'browser' : 'ssr',
    release: version,
  })
}

if (window.__RUNTIME__.start && !window.__ERROR__) {
  if (canUseDOM) {
    document.addEventListener(
      'DOMContentLoaded',
      window.__RENDER_8_RUNTIME__.start
    )
  } else {
    window.__RENDER_8_RUNTIME__.start()
  }
}
