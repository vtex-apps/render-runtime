import {canUseDOM} from 'exenv'

const YEAR_IN_MS = 12 * 30 * 24 * 60 * 60 * 1000

const acceptJson = canUseDOM && new Headers({
  'Accept': 'application/json',
})

export const fetchMessages = () =>
  fetch('?vtex.render-resource=messages', {
    credentials: 'same-origin',
    headers: acceptJson,
  }).then(res => res.json())

export const createLocaleCookie = locale => {
  const yearFromNow = Date.now() + YEAR_IN_MS
  const expires = new Date(yearFromNow).toUTCString()
  const localeCookie = `locale=${locale};path=/;expires=${expires}`
  window.document.cookie = localeCookie
}
