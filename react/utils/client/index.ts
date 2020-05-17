import {
  InMemoryCache,
  IntrospectionFragmentMatcher,
  IntrospectionResultData,
  NormalizedCacheObject,
} from 'apollo-cache-inmemory'
import { ApolloClient } from 'apollo-client'
import { ApolloLink } from 'apollo-link'
import { onError } from 'apollo-link-error'
import { createHttpLink } from 'apollo-link-http'
import { createPersistedQueryLink } from 'apollo-link-persisted-queries'
import { createUploadLink } from 'apollo-upload-client'
import { canUseDOM } from 'exenv'

import PageCacheControl from '../cacheControl'
import graphQLErrorsStore from '../graphQLErrorsStore'
import { generateHash } from './generateHash'
import { toBase64Link } from './links/base64Link'
import { cachingLink } from './links/cachingLink'
import { ensureSessionLink } from './links/ensureSessionLink'
import { createIOFetchLink } from './links/ioFetchLink'
import { omitTypenameLink } from './links/omitVariableTypenameLink'
import { createUriSwitchLink } from './links/uriSwitchLink'
import { versionSplitterLink } from './links/versionSplitterLink'

interface ApolloClientsRegistry {
  [key: string]: ApolloClient<NormalizedCacheObject>
}

const buildCacheId = (
  vendor: string | undefined,
  app: string | undefined,
  major: string | undefined,
  type: string,
  cacheId: string
) =>
  app && major
    ? `${vendor}.${app}@${major}.x:${type}:${cacheId}`
    : `${type}:${cacheId}`

const dataIdFromObject = (value: any) => {
  const { cacheId, __typename } = value || ({} as any)
  if (value && __typename && cacheId) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [vendor, app, major, ...type] = __typename.split('_')
    const typename = type.join('_') || __typename
    return buildCacheId(vendor, app, major, typename, cacheId)
  }
  return null
}

export const buildCacheLocator = (
  app: string,
  type: string,
  cacheId: string
) => {
  const [vendor, appAndMajor] = app.replace(/-/g, '').split('.')
  const [appName, major] = appAndMajor && appAndMajor.split('@')
  return buildCacheId(vendor, appName, major, type, cacheId)
}

const clientsByWorkspace: ApolloClientsRegistry = {}

export const getState = (runtime: RenderRuntime) => {
  const { account, workspace } = runtime
  const apolloClient = clientsByWorkspace[`${account}/${workspace}`]
  return apolloClient ? apolloClient.cache.extract() : {}
}

export const getClient = (
  runtime: RenderRuntime,
  baseURI: string,
  runtimeContextLink: ApolloLink,
  sessionPromise: Promise<any>,
  fetcher: GlobalFetch['fetch'],
  cacheControl?: PageCacheControl
) => {
  const {
    account,
    workspace,
    introspectionResult,
  }: {
    account: string
    workspace: string
    introspectionResult: IntrospectionResultData
  } = runtime

  if (!clientsByWorkspace[`${account}/${workspace}`]) {
    const cache = new InMemoryCache({
      addTypename: true,
      dataIdFromObject,
      fragmentMatcher: new IntrospectionFragmentMatcher({
        introspectionQueryResultData: introspectionResult,
      }),
    })

    const httpLink = ApolloLink.from([
      toBase64Link,
      createHttpLink({
        credentials: 'include',
        useGETForQueries: false,
        fetch: fetcher,
      }),
    ])

    const uploadLink = createUploadLink({
      credentials: 'include',
    })

    const fetcherLink = createIOFetchLink(httpLink, uploadLink)

    const persistedQueryLink = createPersistedQueryLink({
      disable: () => false,
      generateHash,
      useGETForHashedQueries: true,
    })

    const uriSwitchLink = createUriSwitchLink(baseURI, runtime)

    const cacheLink = cacheControl ? [cachingLink(cacheControl)] : []

    const errorLink = onError(({ graphQLErrors }) => {
      if (graphQLErrors) {
        graphQLErrorsStore.addOperationIds(graphQLErrors)
      }
    })

    const link = ApolloLink.from([
      errorLink,
      omitTypenameLink,
      versionSplitterLink,
      runtimeContextLink,
      persistedQueryLink,
      uriSwitchLink,
      ensureSessionLink(sessionPromise),
      ...cacheLink,
      fetcherLink, //this is a final link
    ])

    clientsByWorkspace[`${account}/${workspace}`] = new ApolloClient({
      cache: canUseDOM ? cache.restore(window.__STATE__) : cache,
      link,
      resolvers: {},
      ssrMode: !canUseDOM,
      /** TODO: The empty typedefs below fixes an issue with Apollo Devtools.
       * Should look into why it is needed in the first place.
       * https://github.com/apollographql/apollo-client-devtools/issues/238
       */
      typeDefs: {} as any,
    })
  }

  return clientsByWorkspace[`${account}/${workspace}`]
}
