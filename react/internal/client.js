import {canUseDOM} from 'exenv'
import {ApolloClient} from 'apollo-client'
import {createHttpLink} from 'apollo-link-http'
import {InMemoryCache} from 'apollo-cache-inmemory'
import {createHttpSwitchLink, httpSwitchFetcher} from './http-switch-link'

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

    const httpLink = createHttpLink({
      batchInterval: 80,
      credentials: 'same-origin',
      fetch: httpSwitchFetcher
    })

    const uri = canUseDOM ? graphQlUri.browser : graphQlUri.ssr
    const httpSwitchLink = createHttpSwitchLink(uri)

    client = new ApolloClient({
      link: httpSwitchLink.concat(httpLink),
      ssrMode: !canUseDOM,
      cache: canUseDOM ? cache.restore(global.__STATE__) : cache,
    })
  }
  return client
}
