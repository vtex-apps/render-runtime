import {NormalizedCacheObject} from 'apollo-cache-inmemory'
import ApolloClient from 'apollo-client'
import {canUseDOM} from 'exenv'
import runtimeQuery from './runtime.graphql'

const acceptJson = canUseDOM ? new Headers({
  'Accept': 'application/json',
}) : undefined

export const fetchRuntime = (apolloClient: ApolloClient<NormalizedCacheObject>, page: string, production: boolean, locale: string, renderMajor: number) => {
  const renderVersion = `${renderMajor}.x`
  return apolloClient.query<{page: PageQueryResponse}>({query: runtimeQuery, variables: {page, production, locale, renderVersion}})
    .then<ParsedPageQueryResponse>(result => {
      const {data: {page: {componentsJSON, extensionsJSON, messagesJSON, pagesJSON}}} = result
      const [components, extensions, messages, pages] = [componentsJSON, extensionsJSON, messagesJSON, pagesJSON].map(json => JSON.parse(json))

      return {
        components,
        extensions,
        messages,
        pages,
      }
    })
}
