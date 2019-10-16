import { path } from 'ramda'

const locale = path<string>(['__RUNTIME__', 'culture', 'locale'], window)
const [lang] = locale ? locale.split('-') : ''

if (lang && window.Intl && !window.Intl.PluralRules) {
  if (!window.IntlPluralRules || !window.IntlPluralRules.PluralRules) {
    import('@formatjs/intl-pluralrules/polyfill' as any).then(() => {
      import('@formatjs/intl-pluralrules/dist/locale-data/' + lang).then(() => {
        window.Intl.PluralRules = window.IntlPluralRules.PluralRules
      })
    })
  } else {
    window.Intl.PluralRules = window.IntlPluralRules.PluralRules
  }
}

if (lang && window.Intl && !window.Intl.RelativeTimeFormat) {
  if (
    !window.IntlRelativeTimeFormat ||
    !window.IntlRelativeTimeFormat.default
  ) {
    import('@formatjs/intl-relativetimeformat/polyfill' as any).then(() => {
      import('@formatjs/intl-relativetimeformat/dist/locale-data/' + lang).then(
        () => {
          window.Intl.RelativeTimeFormat = window.IntlRelativeTimeFormat.default
        }
      )
    })
  } else {
    window.Intl.RelativeTimeFormat = window.IntlRelativeTimeFormat.default
  }
}
