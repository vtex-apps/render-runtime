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

myPromise = new Promise(resolve => {
  const hasPolyfilledPlural =
    window.Intl.PluralRules.polyfilled && canUseDOM && lang
  const hasPolyfilledRelative =
    window.Intl.RelativeTimeFormat.polyfilled && canUseDOM && lang
  let isPluralLocaleImported = false
  let iRelativeLocaleImported = false

  if (hasPolyfilledPlural) {
    import('@formatjs/intl-pluralrules/dist/locale-data/' + lang).then(() => {
      isPluralLocaleImported = true
      if (isPluralLocaleImported && iRelativeLocaleImported) {
        resolve()
      }
    })
  }

  if (hasPolyfilledRelative) {
    import('@formatjs/intl-relativetimeformat/dist/locale-data/' + lang).then(
      () => {
        iRelativeLocaleImported = true
        if (isPluralLocaleImported && iRelativeLocaleImported) {
          resolve()
        }
      }
    )
  }
  if (!hasPolyfilledPlural && !hasPolyfilledRelative) {
    resolve()
  }
})

export default myPromise
