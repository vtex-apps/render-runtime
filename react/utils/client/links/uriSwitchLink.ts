import {ApolloLink, NextLink, Observable, Operation, RequestHandler} from 'apollo-link'
import {canUseDOM} from 'exenv'
import {ArgumentNode, DocumentNode, OperationDefinitionNode, visit} from 'graphql'

const assetsExtractorVisitor = (assets: any) => ({
  Argument (node: ArgumentNode) {
    if (node.name.value === 'scope') {
      assets.scope = node.value.value
    }
    else if (node.name.value === 'version') {
      assets.version = node.value.value
    }
    else if (node.name.value === 'maxAge') {
      assets.maxAge = node.value.value
    }
  }
})

const operationNameVisitor = (assets: any) => ({
  OperationDefinition (node: OperationDefinitionNode) {
    if (!assets.operation) {
      assets.operation = node.operation
    }
  }
})

const assetsFromQuery = (query: DocumentNode) => {
  const assets = {version: '1', scope: 'public', maxAge: 'long', operation: undefined}
  visit(query, assetsExtractorVisitor(assets))
  visit(query, operationNameVisitor(assets))
  return assets
}

export const createUriSwitchLink = (workspace: string, baseURI: string) => new ApolloLink((operation: Operation, forward?: NextLink) => {
  const {query} = operation
  const assets = assetsFromQuery(operation.query)
  const protocol = canUseDOM ? 'https:' : 'http:'
  operation.setContext(({ fetchOptions = {} }) => {
    const method = (assets.scope === 'public' && assets.operation === 'query') ? 'GET' : 'POST'
    return {
      ...operation.getContext(),
      fetchOptions: {...fetchOptions, method},
      uri: `${protocol}//${baseURI}/_v/graphql/${assets.scope}/v${assets.version}?workspace=${workspace}&maxAge=${assets.maxAge}`,
    }
  })
  return forward ? forward(operation) : null
})
