import { path } from 'ramda'
import { canUseDOM } from 'exenv'

import { PluralRules } from '@formatjs/intl-pluralrules'
import RelativeTimeFormat from '@formatjs/intl-relativetimeformat'

let myPromise = null

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

myPromise = new Promise((resolve) => {
  const hasPolyfilledPlural =
    window.Intl.PluralRules.polyfilled && canUseDOM && lang
  const hasPolyfilledRelative =
    window.Intl.RelativeTimeFormat.polyfilled && canUseDOM && lang

  const pluralPromise = hasPolyfilledPlural
    ? import('@formatjs/intl-pluralrules/dist/locale-data/' + lang)
    : Promise.resolve()
  const relativeTimePromise = hasPolyfilledRelative
    ? import('@formatjs/intl-relativetimeformat/dist/locale-data/' + lang)
    : Promise.resolve()
  Promise.all([pluralPromise, relativeTimePromise]).then(resolve)
})

export default myPromise
