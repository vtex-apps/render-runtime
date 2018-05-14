import {NormalizedCacheObject} from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import {canUseDOM} from 'exenv'
import runtimeQuery from './runtime.graphql'

const parsePageQueryResponse = (response: PageQueryResponse): ParsedPageQueryResponse => {
  const {componentsJSON, extensionsJSON, messagesJSON, pagesJSON, appsSettingsJSON, appsEtag} = response
  const [components, extensions, messages, pages, settings] = [
    componentsJSON,
    extensionsJSON,
    messagesJSON,
    pagesJSON,
    appsSettingsJSON,
  ].map(json => JSON.parse(json))

  return {
    appsEtag,
    components,
    extensions,
    messages,
    pages,
    settings
  }
}

export const fetchRuntime = (apolloClient: ApolloClient<NormalizedCacheObject>, page: string, production: boolean, locale: string, renderMajor: number) => {
  const renderVersion = `${renderMajor}.x`
  return apolloClient.query<{page: PageQueryResponse}>({query: runtimeQuery, fetchPolicy: 'network-only', variables: {page, production, locale, renderVersion}})
    .then<ParsedPageQueryResponse>(({data, errors}) =>
      errors ? Promise.reject(errors) : parsePageQueryResponse(data.page)
    )
}
