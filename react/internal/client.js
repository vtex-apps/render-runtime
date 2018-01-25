import {canUseDOM} from 'exenv'
import {ApolloClient} from 'apollo-client'
import {createHttpLink} from './httpLink'
import {InMemoryCache} from 'apollo-cache-inmemory'

let client
const {graphQlUri} = global.__RUNTIME__

function getDataIdFromObject({id, __typename}) {
  return id && __typename ? `${__typename}:${id}` : null
}

export default () => {
  if (!client) {
    const cache = new InMemoryCache({
      dataIdFromObject: getDataIdFromObject,
      addTypename: true,
    })

    client = new ApolloClient({
      link: createHttpLink({
        uri: canUseDOM ? graphQlUri.browser : graphQlUri.ssr,
        batchInterval: 80,
        credentials: 'same-origin',
      }),
      ssrMode: !canUseDOM,
      cache: canUseDOM ? cache.restore(global.__STATE__) : cache,
    })
  }
  return client
}
