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
  let hasImportedPlural =
    !window.Intl.PluralRules.polyfilled || !canUseDOM || !lang
  let hasImportedRelative =
    !window.Intl.RelativeTimeFormat.polyfilled || !canUseDOM || !lang

  if (!hasImportedPlural) {
    import('@formatjs/intl-pluralrules/dist/locale-data/' + lang).then(() => {
      hasImportedPlural = true
      if (hasImportedPlural && hasImportedRelative) {
        resolve()
      }
    })
  }

  if (!hasImportedRelative) {
    import('@formatjs/intl-relativetimeformat/dist/locale-data/' + lang).then(
      () => {
        hasImportedRelative = true
        if (hasImportedPlural && hasImportedRelative) {
          resolve()
        }
      }
    )
  }
  if (hasImportedPlural && hasImportedRelative) {
    resolve()
  }
})

export default myPromise
