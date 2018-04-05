import {ApolloLink, NextLink, Observable, Operation, RequestHandler} from 'apollo-link'
import {canUseDOM} from 'exenv'
import {ArgumentNode, DocumentNode, OperationDefinitionNode, visit, DirectiveNode} from 'graphql'

const assetsVisitor = (assets: any) => ({
  Directive (node: DirectiveNode) {
    if (node.name.value === 'context' && node.arguments) {
      node.arguments.forEach((argNode: ArgumentNode) => {
        if (argNode.name.value === 'scope') {
          assets.scope = argNode.value.value
        }
        else if (argNode.name.value === 'version') {
          assets.version = argNode.value.value
        }
        else if (argNode.name.value === 'maxAge') {
          assets.maxAge = argNode.value.value
        }
      })
    }
  },
  OperationDefinition (node: OperationDefinitionNode) {
    if (!assets.operation) {
      assets.operation = node.operation
    }
  }
})

const assetsFromQuery = (query: DocumentNode) => {
  const assets = {version: '1', scope: 'public', maxAge: 'long', operation: undefined}
  visit(query, assetsVisitor(assets))
  return assets
}

export const createUriSwitchLink = (workspace: string, baseURI: string, appsEtag: string) =>
  new ApolloLink((operation: Operation, forward?: NextLink) => {
    const {query} = operation
    const assets = assetsFromQuery(operation.query)
    const protocol = canUseDOM ? 'https:' : 'http:'
    operation.setContext(({ fetchOptions = {} }) => {
      const method = (assets.scope === 'public' && assets.operation === 'query') ? 'GET' : 'POST'
      return {
        ...operation.getContext(),
        fetchOptions: {...fetchOptions, method},
        uri: `${protocol}//${baseURI}/_v/graphql/${assets.scope}/v${assets.version}?workspace=${workspace}&maxAge=${assets.maxAge}&appsEtag=${appsEtag}`,
      }
    })
    return forward ? forward(operation) : null
  })
