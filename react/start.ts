import * as Sentry from '@sentry/browser'
import {canUseDOM} from 'exenv'

if (canUseDOM && window.__RUNTIME__.production) {
  const { config = null, version = '' } = window.__RUNTIME__.runtimeMeta || {}
  const shouldDisableSentry = window?.vtex?.disableSentry
  // If dsn is omitted, no data is sent to Sentry
  const dsn = shouldDisableSentry ? undefined : (config && config.sentryDSN)
  Sentry.init({
    beforeSend: (event: Sentry.SentryEvent) => event.tags && event.tags.component ? event : null,
    defaultIntegrations: true,
    dsn,
    environment: canUseDOM ? 'browser' : 'ssr',
    release: version
  })
}

if (window.__RUNTIME__.start) {
  window.__RENDER_7_RUNTIME__.start()
}
