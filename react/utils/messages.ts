import { pluck, zipObj } from 'ramda'

const YEAR_IN_MS = 12 * 30 * 24 * 60 * 60 * 1000

export const parseMessages = (messages: KeyedString[] | null) => {
  return messages && zipObj(pluck('key', messages), pluck('message', messages))
}

export const createLocaleCookie = (locale: string) => {
  const yearFromNow = Date.now() + YEAR_IN_MS
  const expires = new Date(yearFromNow).toUTCString()
  const localeCookie = `locale=${locale};path=/;expires=${expires}`
  window.document.cookie = localeCookie
}
