import {canUseDOM} from 'exenv'
import ApolloClient, {createBatchingNetworkInterface} from 'apollo-client'
import state from './state'

const {graphQlUri} = state

export default new ApolloClient({
  networkInterface: createBatchingNetworkInterface({
    uri: canUseDOM ? graphQlUri.browser : graphQlUri.ssr,
    batchInterval: 80,
    opts: {
      credentials: 'same-origin',
    },
  }),
  ssrMode: !canUseDOM,
  addTypename: true,
  initialState: canUseDOM && {apollo: global.__STATE__},
  dataIdFromObject: function getDataIdFromObject (result) {
    const id = (result.slug || result.orderFormId)
    if (result.__typename === 'Facet') {
      return null
    }
    if (id && result.__typename) {
      return result.__typename + ':' + id
    }
    return null
  },
})
