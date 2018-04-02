import {ApolloLink, NextLink, Operation} from 'apollo-link'
import PageCacheControl from '../../cacheControl'

export const cachingLink = (cacheControl: PageCacheControl) => {
  return new ApolloLink((operation: Operation, forward?: NextLink) => {
    if (forward) {
      return forward(operation).map(data => {
        const {response} = operation.getContext()
        cacheControl.evaluate(response)
        return data
      })
    }
    return null
  })
}
