import {ApolloLink, NextLink, Observable, Operation, RequestHandler} from 'apollo-link'
import {canUseDOM} from 'exenv'
import {DocumentNode, visit} from 'graphql'

const assetsExtractorVisitor = (assets: any) => ({
  Argument (node: any) {
    if (node.name.value === 'scope') {
      assets.scope = node.value.value
    }
    else if (node.name.value === 'version') {
      assets.version = node.value.value
    }
  }
})

const assetsFromQuery = (query: DocumentNode) => {
  const assets = {version: '1', scope: 'public'}
  visit(query, assetsExtractorVisitor(assets))
  return assets
}

export const createUriSwitchLink = (workspace: string, baseURI: string) => new ApolloLink((operation: Operation, forward?: NextLink) => {
  const assets = assetsFromQuery(operation.query)
  const protocol = canUseDOM ? 'https:' : 'http:'
  operation.setContext(({ fetchOptions = {} }) => {
    const method = assets.scope === 'private' ? 'POST' : 'GET'
    return {
      ...operation.getContext(),
      fetchOptions: {...fetchOptions, method},
      uri: `${protocol}//${baseURI}/_v/graphql/${assets.scope}/v${assets.version}?workspace=${workspace}`,
    }
  })
  return forward ? forward(operation) : null
})
