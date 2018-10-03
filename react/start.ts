import * as Sentry from '@sentry/browser'
import {canUseDOM} from 'exenv'

if (canUseDOM && window.__RUNTIME__.production) {
  Sentry.init({
    defaultIntegrations: true,
    dsn: window.__RUNTIME__.sentryDSN,
    environment: canUseDOM ? 'browser' : 'ssr',
    release: window.__RUNTIME__.version
  })
}

if (window.__RUNTIME__.start) {
  window.__RENDER_7_RUNTIME__.start()
}
