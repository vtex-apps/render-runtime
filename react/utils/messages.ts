import { NormalizedCacheObject } from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import {canUseDOM} from 'exenv'
import appMessagesQuery from './appMessages.graphql'
import pageMessagesQuery from './messages.graphql'

const YEAR_IN_MS = 12 * 30 * 24 * 60 * 60 * 1000

export const fetchMessagesForApp = (apolloClient: ApolloClient<NormalizedCacheObject>, app: string, locale: string) =>
  apolloClient.query<{messages: string}>({query: appMessagesQuery, variables: {app, locale}})
    .then<RenderRuntime['messages']>(({data, errors}) =>
      errors ? Promise.reject(errors) : JSON.parse(data.messages)
    )

export const fetchMessages = (apolloClient: ApolloClient<NormalizedCacheObject>, page: string, production: boolean, locale: string, renderMajor: number) => {
  const renderVersion = `${renderMajor}.x`
  return apolloClient.query<{page: PageQueryResponse}>({query: pageMessagesQuery, variables: {page, production, locale, renderVersion}})
    .then<RenderRuntime['messages']>(({data, errors}) =>
      errors ? Promise.reject(errors) : JSON.parse(data.page.messagesJSON)
    )
}

export const createLocaleCookie = (locale: string) => {
  const yearFromNow = Date.now() + YEAR_IN_MS
  const expires = new Date(yearFromNow).toUTCString()
  const localeCookie = `locale=${locale};path=/;expires=${expires}`
  window.document.cookie = localeCookie
}
