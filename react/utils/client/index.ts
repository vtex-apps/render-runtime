import {InMemoryCache, NormalizedCacheObject} from 'apollo-cache-inmemory'
import {ApolloClient} from 'apollo-client'
import {ApolloLink} from 'apollo-link'
import {createHttpLink} from 'apollo-link-http'
import {createPersistedQueryLink} from 'apollo-link-persisted-queries'
import {canUseDOM} from 'exenv'
import PageCacheControl from '../cacheControl'
import {generateHash} from './generateHash'
import {cachingLink} from './links/cachingLink'
import {createUriSwitchLink} from './links/uriSwitchLink'
import {versionSplitterLink} from './links/versionSplitterLink'

interface ApolloClientsRegistry {
  [key: string]: ApolloClient<NormalizedCacheObject>
}

function getDataIdFromObject(value: any) {
  if (!value) {
    return null
  }
  const {id, __typename} = value
  return id && __typename ? `${__typename}:${id}` : null
}

const clientsByWorkspace: ApolloClientsRegistry = {}

export const getState = (runtime: RenderRuntime) => {
  const {account, workspace} = runtime
  return clientsByWorkspace[`${account}/${workspace}`].cache.extract()
}

export const getClient = (runtime: RenderRuntime, baseURI: string, runtimeContextLink: ApolloLink, cacheControl?: PageCacheControl) => {
  const {account, workspace} = runtime

  if (!clientsByWorkspace[`${account}/${workspace}`]) {
    const cache = new InMemoryCache({
      addTypename: true,
      dataIdFromObject: getDataIdFromObject,
    })

    const httpLink = createHttpLink({
      credentials: 'include',
    })

    const persistedQueryLink = createPersistedQueryLink({
      disable: () => true,
      generateHash
    })

    const uriSwitchLink = createUriSwitchLink(baseURI, workspace)
    const link = cacheControl
      ? ApolloLink.from([versionSplitterLink, runtimeContextLink, uriSwitchLink, cachingLink(cacheControl), persistedQueryLink, httpLink])
      : ApolloLink.from([versionSplitterLink, runtimeContextLink, uriSwitchLink, persistedQueryLink, httpLink])

    clientsByWorkspace[`${account}/${workspace}`] = new ApolloClient({
      cache: canUseDOM ? cache.restore(global.__STATE__) : cache,
      link,
      ssrMode: !canUseDOM,
    })
  }

  return clientsByWorkspace[`${account}/${workspace}`]
}
