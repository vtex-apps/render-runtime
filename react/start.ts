import * as Sentry from '@sentry/browser'
import {canUseDOM} from 'exenv'

if (canUseDOM && window.__RUNTIME__.production) {
  const { config = null, version = '' } = window.__RUNTIME__.runtimeMeta || {}
  const dsn = config && config.sentryDSN
  console.log('using dsn', dsn)
  Sentry.init({
    defaultIntegrations: true,
    dsn,
    environment: canUseDOM ? 'browser' : 'ssr',
    release: version
  })
}

if (window.__RUNTIME__.start) {
  window.__RENDER_7_RUNTIME__.start()
}
