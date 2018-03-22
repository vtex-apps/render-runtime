import {ApolloLink, NextLink, Observable, Operation, RequestHandler} from 'apollo-link'
import {canUseDOM} from 'exenv'
import {DocumentNode, visit} from 'graphql'

const versionExtractorVisitor = (assets: any) => ({
  Argument (node: any) {
    if (node.name.value === 'version') {
      assets.version = node.value.value
    }
  }
})

const scopeExtractorVisitor = (assets: any) => ({
  Argument (node: any) {
    if (node.name.value === 'scope') {
      assets.scope = node.value.value
    }
  }
})

const assetsFromQuery = (query: DocumentNode) => {
  const assets = {version: '1', scope: 'public'}
  visit(query, versionExtractorVisitor(assets))
  visit(query, scopeExtractorVisitor(assets))
  return assets
}

export const uriSwitchLink = (baseURI: string) => new ApolloLink((operation: Operation, forward?: NextLink) => {
  const assets = assetsFromQuery(operation.query)
  const protocol = canUseDOM ? 'https:' : 'http:'
  operation.setContext(({ fetchOptions = {} }) => {
    const method = assets.scope === 'private' ? 'POST' : 'GET'
    return {
      ...operation.getContext(),
      fetchOptions: {...fetchOptions, method},
      uri: `${protocol}//${baseURI}/_v/graphql/v${assets.version}/${assets.scope}`,
    }
  })
  return forward ? forward(operation) : null
})
