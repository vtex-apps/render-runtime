import {canUseDOM} from 'exenv'

const YEAR_IN_MS = 12 * 30 * 24 * 60 * 60 * 1000

const acceptJson = canUseDOM ? new Headers({
  'Accept': 'application/json',
}) : undefined

const acceptAndContentJson = canUseDOM ? new Headers({
  'Accept': 'application/json',
  'Content-Type': 'application/json',
}) : undefined

export const fetchMessagesForApp = (graphQlUri: string, app: string, locale: string) =>
  fetch(graphQlUri, {
    body: JSON.stringify({
      query: `{ messages(app: "${app}", locale: "${locale}") }`,
    }),
    credentials: 'include',
    headers: acceptAndContentJson,
    method: 'POST',
  })
  .then(res => res.json())
  .then<RenderRuntime['messages']>(data => {
    const messagesJSON = data.data.messages
    return JSON.parse(messagesJSON)
  })

export const fetchMessages = (graphQlUri: string) =>
  fetch(graphQlUri.replace('=graphql', '=messages'), {
    credentials: 'include',
    headers: acceptJson,
  }).then<RenderRuntime['messages']>(res => res.json())

export const createLocaleCookie = (locale: string) => {
  const yearFromNow = Date.now() + YEAR_IN_MS
  const expires = new Date(yearFromNow).toUTCString()
  const localeCookie = `locale=${locale};path=/;expires=${expires}`
  window.document.cookie = localeCookie
}
