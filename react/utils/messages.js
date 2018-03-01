import {canUseDOM} from 'exenv'

const YEAR_IN_MS = 12 * 30 * 24 * 60 * 60 * 1000

const acceptJson = canUseDOM && new Headers({
  'Accept': 'application/json',
})

const acceptAndContentJson = canUseDOM && new Headers({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
})

export const fetchMessagesForApp = (graphQlUri, app, locale) =>
  fetch(graphQlUri, {
    credentials: 'include',
    headers: acceptAndContentJson,
    method: 'POST',
    body: JSON.stringify({
      query: `{ messages(app: "${app}", locale: "${locale}") }`,
    }),
  })
  .then(res => res.json())
  .then(data => {
    const messagesJSON = data.data.messages
    return JSON.parse(messagesJSON)
  })

export const fetchMessages = (graphQlUri) =>
  fetch(graphQlUri.replace('=graphql', '=messages'), {
    credentials: 'include',
    headers: acceptJson,
  }).then(res => res.json())

export const createLocaleCookie = locale => {
  const yearFromNow = Date.now() + YEAR_IN_MS
  const expires = new Date(yearFromNow).toUTCString()
  const localeCookie = `locale=${locale};path=/;expires=${expires}`
  window.document.cookie = localeCookie
}
