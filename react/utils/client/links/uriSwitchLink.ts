import { ApolloLink, NextLink, Operation } from 'apollo-link'
import { path } from 'ramda'
import { canUseDOM } from 'exenv'
import {
  ASTNode,
  DirectiveNode,
  OperationDefinitionNode,
  StringValueNode,
  visit,
} from 'graphql'

import { generateHash } from '../generateHash'
import { appendLocationSearch } from '../../location'

interface Assets {
  operationType: string
  queryScope?: string
}

const assetsFromQuery = (query: ASTNode) => {
  const assets: Assets = { operationType: 'mutation' }
  visit(query, {
    Directive(node: DirectiveNode) {
      if (node.name.value === 'context') {
        const scopeArg =
          node.arguments &&
          node.arguments.find(argNode => argNode.name.value === 'scope')
        if (scopeArg) {
          assets.queryScope = (scopeArg.value as StringValueNode).value
        }
      }
    },
    OperationDefinition(node: OperationDefinitionNode) {
      assets.operationType = node.operation
    },
  })
  return assets
}

export interface OperationContext {
  fetchOptions: any
  runtime: Pick<
    RenderRuntime,
    | 'appsEtag'
    | 'cacheHints'
    | 'components'
    | 'culture'
    | 'salesChannel'
    | 'extensions'
    | 'messages'
    | 'pages'
  >
}

const extractHints = (query: ASTNode, meta: CacheHints) => {
  const { operationType, queryScope } = assetsFromQuery(query)

  let hints
  if (operationType?.toLowerCase() === 'query') {
    hints = meta ? meta : { scope: queryScope }
  } else {
    hints = { ...meta, scope: 'private' }
  }

  const {
    maxAge = 'long',
    scope = 'public',
    version = 1,
    provider,
    sender,
  } = hints
  return {
    maxAge: maxAge.toLowerCase(),
    operationType,
    scope: scope.toLowerCase(),
    version,
    provider,
    sender,
  }
}

export const createUriSwitchLink = (
  baseURI: string,
  initialRuntime: RenderRuntime
) =>
  new ApolloLink((operation: Operation, forward?: NextLink) => {
    operation.setContext((oldContext: OperationContext) => {
      const {
        fetchOptions = {},
        // Fetches from context for not fetching a stale version of runtime
        runtime: {
          appsEtag,
          cacheHints,
          culture: { locale },
          salesChannel,
        },
      } = oldContext
      const { extensions } = operation
      const {
        binding,
        workspace,
        route: { domain },
        production,
      } = initialRuntime
      const hash = generateHash(operation.query)

      if (!production && !hash) {
        throw new Error(
          'Could not generate hash from query. Are you using graphql-tag ? Split your graphql queries in .graphql files and import them instead'
        )
      }

      const includeQuery = (oldContext as any).http?.includeQuery || !hash
      const { maxAge, scope, version, provider, sender } = extractHints(
        operation.query,
        cacheHints[hash]
      )
      const requiresAuthorization = path(
        ['settings', `vtex.${domain}`, 'requiresAuthorization'],
        initialRuntime
      )
      const customScope = requiresAuthorization ? 'private' : scope
      const oldMethod = includeQuery ? 'POST' : fetchOptions.method || 'POST'
      const protocol = canUseDOM ? 'https:' : 'http:'
      const method =
        customScope?.toLowerCase() === 'private' ? 'POST' : oldMethod
      extensions.persistedQuery = {
        ...extensions.persistedQuery,
        sender,
        provider,
      }

      const queryObj: Record<string, string> = {
        workspace,
        maxAge,
        appsEtag,
        domain,
        locale,
        sc: String(salesChannel),
      }

      let query = Object.keys(queryObj).reduce(
        (
          queryString: string,
          objKey: string,
          index: number,
          queryObjKeys: string[]
        ) => {
          let nextKeyPrefix = ''
          if (index < queryObjKeys.length - 1) {
            nextKeyPrefix = '&'
          }
          return `${queryString}${objKey}=${queryObj[objKey]}${nextKeyPrefix}`
        },
        '?'
      )

      if (binding && binding.id) {
        query = appendLocationSearch(query, { __bindingId: binding.id })
      }

      return {
        ...oldContext,
        http: {
          ...(oldContext as any).http,
          includeQuery,
        },
        scope: customScope,
        fetchOptions: { ...fetchOptions, method },
        uri: `${protocol}//${baseURI}/_v/${customScope}/graphql/v${version}${query}`,
      }
    })
    return forward ? forward(operation) : null
  })
