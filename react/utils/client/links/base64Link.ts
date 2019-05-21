import { ApolloLink, NextLink, Operation } from 'apollo-link'
import { Base64 } from 'js-base64'

export const toBase64Link = new ApolloLink(
  (operation: Operation, forward?: NextLink) => {
    console.log('op')
    console.log({ variables: operation.variables })
    const { extensions, variables } = operation
    if (variables && Object.keys(variables).length > 0) {
      operation.variables = {}
      operation.extensions = {
        ...extensions,
        variables: Base64.encode(JSON.stringify(variables)),
      }
    }
    return forward ? forward(operation) : null
  }
)
