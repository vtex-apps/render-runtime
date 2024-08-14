import * as Sentry from '@sentry/react'
import { isAdmin } from '../utils/isAdmin'
import { getExtraArgs } from './extraArgs'

if (isAdmin()) {
  Sentry.init({
    dsn:
      'https://2fac72ea180d48ae9bf1dbb3104b4000@o191317.ingest.us.sentry.io/1292015',
    integrations: [Sentry.replayIntegration()],

    // Set tracesSampleRate to 0.1 to capture 10%
    // of transactions for tracing.
    tracesSampleRate: 0.1,

    // Set `tracePropagationTargets` to control for which URLs trace propagation should be enabled
    tracePropagationTargets: [
      /^\//,
      /^(https?:\/\/)?([a-z0-9]+[.])*myvtex\.com/,
    ],

    // Capture Replay for 0% of all sessions,
    // plus for 50% of sessions with an error
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,

    beforeSend: (event, hint) => {
      const extraArgs = getExtraArgs()

      return { ...event, ...extraArgs, ...hint }
    },
  })
}
