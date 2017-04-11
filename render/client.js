import {canUseDOM} from 'exenv'
import ApolloClient, {createBatchingNetworkInterface} from 'apollo-client'
import {getCustomResolvers, getDataIdFromObject} from './apolloConfig'
import state from './state'

const {graphQlUri} = state

let client

export default () => {
  if (!client) {
    client = new ApolloClient({
      networkInterface: createBatchingNetworkInterface({
        uri: canUseDOM ? graphQlUri.browser : graphQlUri.ssr,
        batchInterval: 80,
        opts: {
          credentials: 'same-origin',
        },
      }),
      ssrMode: !canUseDOM,
      addTypename: true,
      initialState: canUseDOM && { apollo: global.__STATE__ },
      dataIdFromObject: getDataIdFromObject,
      customResolvers: getCustomResolvers(),
    })
  }
  return client
}
