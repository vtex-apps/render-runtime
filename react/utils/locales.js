import {addLocaleData as addReactLocaleData} from 'react-intl'
import {shouldAddScriptToPage, addScriptToPage} from '../utils/assets'

const getLang = (locale) => locale.split('-')[0]

const loadReactIntlData = (locale) => {
  const path = `https://unpkg.com/react-intl@2.4.0/locale-data/${getLang(locale)}.js`
  return shouldAddScriptToPage(path)
    ? addScriptToPage(path).then(() => addLocaleData(locale))
    : Promise.resolve()
}

const loadIntlData = (locale) => {
  const path = `https://unpkg.com/intl@1.2.5/locale-data/jsonp/${locale}.js`
  return global.IntlPolyfill && shouldAddScriptToPage(path) ? addScriptToPage(path) : Promise.resolve()
}

export const loadLocaleData = (locale) => {
  return Promise.all([
    loadReactIntlData(locale),
    loadIntlData(locale),
  ])
}

export const addLocaleData = (locale) => {
  const lang = getLang(locale)
  addReactLocaleData(global.ReactIntlLocaleData[lang])
}

