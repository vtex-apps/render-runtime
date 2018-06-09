import {ApolloLink, NextLink, Observable, Operation, RequestHandler} from 'apollo-link'
import {canUseDOM} from 'exenv'
import {ArgumentNode, BREAK, DirectiveNode, DocumentNode, OperationDefinitionNode, visit} from 'graphql'

const assetsFromQuery = (query: DocumentNode) => {
  const assets = {operationType: 'mutation'}
  visit(query, {
    OperationDefinition (node: OperationDefinitionNode) {
      assets.operationType = node.operation
      return BREAK
    }
  })
  return assets
}

interface OperationContext {
  fetchOptions: any,
  runtime: RenderRuntime,
}

const hashFromExtensions = ext => ext && ext.persistedQuery && ext.persistedQuery.sha256Hash

export const createUriSwitchLink = (baseURI: string) =>
  new ApolloLink((operation: Operation, forward?: NextLink) => {
    const hash = hashFromExtensions(operation.extensions)
    const {operationType} = assetsFromQuery(operation.query)
    const protocol = canUseDOM ? 'https:' : 'http:'
    operation.setContext(({ fetchOptions = {}, runtime: {appsEtag, cacheHints, workspace} } : OperationContext) => {
      const {maxAge = 'LONG', scope = 'PUBLIC', version = 1} = cacheHints[hash] || {}
      const method = (scope.toLowerCase() === 'public' && operationType.toLowerCase() === 'query') ? 'GET' : 'POST'
      return {
        ...operation.getContext(),
        fetchOptions: {...fetchOptions, method},
        uri: `${protocol}//${baseURI}/_v/graphql/${scope.toLowerCase()}/v${version}?workspace=${workspace}&maxAge=${maxAge.toLowerCase()}&appsEtag=${appsEtag}`,
      }
    })
    return forward ? forward(operation) : null
  })
