import {canUseDOM} from 'exenv'
import {ApolloClient} from 'apollo-client'
import {createHttpLink} from 'apollo-link-http'
import {InMemoryCache} from 'apollo-cache-inmemory'
import {createPersistedQueryLink, defaultOptions} from 'apollo-link-persisted-queries'

function getDataIdFromObject({id, __typename}) {
  return id && __typename ? `${__typename}:${id}` : null
}

const clientsByWorkspace = []

export const getState = (runtime) => {
  const {account, workspace} = runtime
  return clientsByWorkspace[`${account}/${workspace}`].cache.extract()
}

export const getClient = (runtime) => {
  const {graphQlUri, account, workspace} = runtime

  if (!clientsByWorkspace[`${account}/${workspace}`]) {
    const cache = new InMemoryCache({
      dataIdFromObject: getDataIdFromObject,
      addTypename: true,
    })
    const uri = canUseDOM ? graphQlUri.browser : graphQlUri.ssr

    const httpLink = createHttpLink({
      batchInterval: 80,
      credentials: 'same-origin',
      uri,
    })

    const persistedQueryLink = createPersistedQueryLink({
      generateHash: ({documentId}) => documentId,
      disable: defaultOptions.disable
    })

    client = new ApolloClient({
      link: persistedQueryLink.concat(httpLink),
      ssrMode: !canUseDOM,
      cache: canUseDOM ? cache.restore(global.__STATE__) : cache,
    })
  }

  return clientsByWorkspace[`${account}/${workspace}`]
}
