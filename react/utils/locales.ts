export const addLocaleData = (locale: string) => {
  const countryOnly = locale.split('-')[0]
  if (!window.Intl.PluralRules) {
    require('@formatjs/intl-pluralrules/polyfill')
    require(`@formatjs/intl-pluralrules/dist/locale-data/${countryOnly}`)
  }
  if (!window.Intl.RelativeTimeFormat) {
    require('@formatjs/intl-relativetimeformat/polyfill')
    require(`@formatjs/intl-relativetimeformat/dist/locale-data/${countryOnly}`)
  }
}
