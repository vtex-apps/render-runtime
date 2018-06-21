import {ApolloLink, NextLink, Operation} from 'apollo-link'

export const createRuntimeContextLink = () =>
  new ApolloLink((operation: Operation, forward?: NextLink) => {
    operation.setContext((currentContext: Record<string, any>) => {
      return {
        ...currentContext,
        runtime: {},
      }
    })
    return forward ? forward(operation) : null
  })
