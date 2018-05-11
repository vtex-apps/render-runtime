import {ApolloLink, NextLink, Observable, Operation, RequestHandler} from 'apollo-link'
import {canUseDOM} from 'exenv'
import {ArgumentNode, DirectiveNode, DocumentNode, OperationDefinitionNode, visit} from 'graphql'

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
