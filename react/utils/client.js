import {canUseDOM} from 'exenv'
import {ApolloClient} from 'apollo-client'
import {createHttpLink} from 'apollo-link-http'
import {InMemoryCache} from 'apollo-cache-inmemory'

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

    clientsByWorkspace[`${account}/${workspace}`] = new ApolloClient({
      link: createHttpLink({
        uri: canUseDOM ? graphQlUri.browser : graphQlUri.ssr,
        batchInterval: 80,
        credentials: 'include',
      }),
      ssrMode: !canUseDOM,
      cache: canUseDOM ? cache.restore(global.__STATE__) : cache,
    })
  }

  return clientsByWorkspace[`${account}/${workspace}`]
}
