import { path } from 'ramda'
import { canUseDOM } from 'exenv'

import { PluralRules } from '@formatjs/intl-pluralrules'
import RelativeTimeFormat from '@formatjs/intl-relativetimeformat'

if (typeof window.Intl.PluralRules === 'undefined' || !canUseDOM) {
  Object.defineProperty(Intl, 'PluralRules', {
    value: PluralRules,
    writable: true,
    enumerable: false,
    configurable: true,
  })
}

if (!('RelativeTimeFormat' in Intl) || !canUseDOM) {
  Object.defineProperty(Intl, 'RelativeTimeFormat', {
    value: RelativeTimeFormat,
    writable: true,
    enumerable: false,
    configurable: true,
  })
}

const locale = path<string>(['__RUNTIME__', 'culture', 'locale'], window)
const [lang] = locale ? locale.split('-') : ['']

if (window.Intl.PluralRules.polyfilled && canUseDOM && lang) {
  import('@formatjs/intl-pluralrules/dist/locale-data/' + lang)
}

if (window.Intl.RelativeTimeFormat.polyfilled && canUseDOM && lang) {
  import('@formatjs/intl-relativetimeformat/dist/locale-data/' + lang)
}
