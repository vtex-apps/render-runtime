import * as Sentry from '@sentry/browser'
import { canUseDOM } from 'exenv'

const sentryDSN = 'https://2fac72ea180d48ae9bf1dbb3104b4000@sentry.io/1292015'

if (canUseDOM && window.__RUNTIME__.production) {
  const { version = '' } = window.__RUNTIME__.runtimeMeta || {}
  Sentry.init({
    beforeSend: (event: Sentry.SentryEvent) =>
      event.tags && event.tags.component ? event : null,
    defaultIntegrations: true,
    dsn: sentryDSN,
    environment: canUseDOM ? 'browser' : 'ssr',
    release: version,
  })
}

if (window.__RUNTIME__.start && !window.__ERROR__) {
  if (canUseDOM) {
    setTimeout(() => window.__RENDER_8_RUNTIME__.start(), 0)
  } else {
    window.__RENDER_8_RUNTIME__.start()
  }
}
