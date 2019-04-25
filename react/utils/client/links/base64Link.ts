import { ApolloLink, NextLink, Operation } from 'apollo-link'
import { Base64 } from 'js-base64'

const MAX_QUERYSTRING_SIZE = 4096

export const toBase64Link = new ApolloLink((operation: Operation, forward?: NextLink) => {
  const {extensions, variables} = operation
  if (variables && Object.keys(variables).length > 0) {
    operation.variables = {}
    operation.extensions = {
      ...extensions,
      variables: Base64.encode(JSON.stringify(variables))
    }
    if (JSON.stringify(operation.extensions).length > MAX_QUERYSTRING_SIZE) {
      const {runtime: {production}} = operation.getContext()
      if (!production) {
        throw new Error('Max querystring size exceeded. Make sure you are not exceeding the graphql query limit')
      }
    }
  }
  return forward ? forward(operation) : null
})
