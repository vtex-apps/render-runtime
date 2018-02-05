import {canUseDOM} from 'exenv'
import {ApolloClient} from 'apollo-client'
import {createHttpLink} from 'apollo-link-http'
import {InMemoryCache} from 'apollo-cache-inmemory'
import {createHttpSwitchFetcher, createHttpSwitchLink} from 'vtex-graphql-utils'

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

    const uri = canUseDOM ? graphQlUri.browser : graphQlUri.ssr

    const fetcher = createHttpSwitchFetcher(fetch)
    const httpSwitchLink = createHttpSwitchLink(uri)
    const httpLink = createHttpLink({
      batchInterval: 80,
      credentials: 'same-origin',
      fetch: fetcher
    })

    client = new ApolloClient({
      link: httpSwitchLink.concat(httpLink),
      ssrMode: !canUseDOM,
      cache: canUseDOM ? cache.restore(global.__STATE__) : cache,
    })
  }
  return client
}
