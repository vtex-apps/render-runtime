import {ApolloLink, NextLink, Operation} from 'apollo-link'
import {canUseDOM} from 'exenv'
import {ASTNode, DirectiveDefinitionNode, OperationDefinitionNode, visit} from 'graphql'
import {generateHash} from '../generateHash'

const assetsFromQuery = (query: ASTNode) => {
  const assets = {operationType: 'mutation', queryScope: undefined}
  visit(query, {
    OperationDefinition (node: OperationDefinitionNode) {
      assets.operationType = node.operation
    },
    Directive (node: DirectiveDefinitionNode) {
      if (node.name.value === 'context') {
        const scopeArg = node.arguments && node.arguments.find((argNode) => argNode.name.value === 'scope')
        if (scopeArg) {
          assets.queryScope = scopeArg.value.value
        }
      }
    }
  })
  return assets
}

interface OperationContext {
  fetchOptions: any,
  runtime: RenderRuntime,
}

const equals = (a: string, b: string) => a && b && a.toLowerCase() === b.toLowerCase()

const extractHints = (query: ASTNode, meta) => {
  const {operationType, queryScope} = assetsFromQuery(query)

  let hints
  if (equals(operationType, 'query')) {
    hints = meta ? meta : {scope: queryScope}
  } else {
    hints = {...meta, scope: 'private'}
  }

  const {maxAge = 'long', scope = 'public', version = 1} = hints
  return {
    maxAge: maxAge.toLowerCase(),
    method: (equals(scope, 'public') && equals(operationType, 'query')) ? 'GET' : 'POST',
    scope: scope.toLowerCase(),
    version,
  }
}

export const createUriSwitchLink = (baseURI: string, workspace: string) =>
  new ApolloLink((operation: Operation, forward?: NextLink) => {
    operation.setContext(({ fetchOptions = {}, runtime: {appsEtag, cacheHints} } : OperationContext) => {
      const hash = generateHash(operation.query)
      const protocol = canUseDOM ? 'https:' : 'http:'
      const {maxAge, scope, version, method} = extractHints(operation.query, cacheHints[hash])
      return {
        ...operation.getContext(),
        fetchOptions: {...fetchOptions, method},
        uri: `${protocol}//${baseURI}/_v/graphql/${scope}/v${version}?workspace=${workspace}&maxAge=${maxAge}&appsEtag=${appsEtag}`,
      }
    })
    return forward ? forward(operation) : null
  })
