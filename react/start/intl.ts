import { canUseDOM } from 'exenv'
import { prop } from 'ramda'

export const polyfillIntl = () => {
  if (window.IntlPolyfill) {
    window.IntlPolyfill.__disableRegExpRestore()
    if (!window.Intl) {
      window.Intl = window.IntlPolyfill
    }
  }

  if (
    window.Intl &&
    canUseDOM &&
    (!window.Intl.PluralRules || !window.Intl.RelativeTimeFormat)
  ) {
    return import('../intl-polyfill').then(prop('default'))
  }

  return Promise.resolve()
}
