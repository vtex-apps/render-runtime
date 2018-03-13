import {addLocaleData as addReactLocaleData} from 'react-intl'
import {addScriptToPage, shouldAddScriptToPage} from '../utils/assets'

const getLang = (locale: string) => locale.split('-')[0]

const loadReactIntlData = (locale: string) => {
  const path = `https://unpkg.com/react-intl@2.4.0/locale-data/${getLang(locale)}.js`
  return shouldAddScriptToPage(path)
    ? addScriptToPage(path).then(() => addLocaleData(locale))
    : Promise.resolve()
}

const loadIntlData = (locale: string) => {
  const path = `https://unpkg.com/intl@1.2.5/locale-data/jsonp/${locale}.js`
  return global.IntlPolyfill && shouldAddScriptToPage(path) ? addScriptToPage(path) : Promise.resolve()
}

export const loadLocaleData = (locale: string) => {
  return Promise.all([
    loadReactIntlData(locale),
    loadIntlData(locale),
  ])
}

export const addLocaleData = (locale: string) => {
  const lang = getLang(locale)
  addReactLocaleData(global.ReactIntlLocaleData[lang])
}

