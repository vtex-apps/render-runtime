import {canUseDOM} from 'exenv'
import ApolloClient, {createBatchingNetworkInterface} from 'apollo-client'

const {
  account,
  workspace,
  hash,
  route,
  version,
  culture: {
    locale,
  },
  placeholders,
  components,
} = global.__RUNTIME__

const client = new ApolloClient({
  networkInterface: createBatchingNetworkInterface({
    uri: canUseDOM
      ? '?vtex.render-resource=graphql'
      : `http://masterdata-graphql.vtex.aws-us-east-1.vtex.io/${account}/${workspace}/graphql`,
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

export default {
  client,
  route,
  account,
  hash,
  locale,
  messages: {},
  components,
  placeholders,
  version,
}
